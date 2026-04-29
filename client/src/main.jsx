import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Beer,
  Check,
  Copy,
  Crown,
  Gamepad2,
  Grid3X3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trophy,
  UserPlus,
  Users,
  X
} from "lucide-react";
import "./styles.css";
import {Button} from "./components/button";
import {cn} from "./lib/utils";

const drinkOptions = [
  {id: "drink_beer_draught", label: "Draft Beer", value: "finger"},
  {id: "drink_beer_bottle", label: "Bottled Beer", value: "swig"},
  {id: "drink_spirit_mixed", label: "Mixed Spirit", value: "finger"},
  {id: "drink_spirit_pure", label: "Pure Spirit", value: "shot"},
  {id: "drink_wine", label: "Wine", value: "sip"}
];

const defaultOptions = {
  playAsAnyone: false,
  betAnyCard: false,
  removeCards: true,
  limitBetsToOne: false,
  wholePack: false
};

const initialSetup = {
  playerName: "",
  selectedGameId: "",
  selectedGameName: "",
  mode: "idle",
  gameName: "",
  extraPlayers: [],
  drinkChoice: "drink_beer_draught",
  drinkType: "finger",
  options: defaultOptions
};

function App() {
  const [activeTab, setActiveTab] = useState("game");
  const [setupView, setSetupView] = useState("form");
  const [setup, setSetup] = useState(initialSetup);
  const [game, setGame] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loggedInPlayer, setLoggedInPlayer] = useState("");
  const [currentBet, setCurrentBet] = useState(0);
  const [cardAnimation, setCardAnimation] = useState(null);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [drinkers, setDrinkers] = useState({players: [], total: 0, start: 0, orderBy: "maxFingers", dir: "desc"});
  const [selectedStatsPlayer, setSelectedStatsPlayer] = useState(null);
  const [loading, setLoading] = useState({players: false, games: false, drinkers: false, game: false});
  const [notice, setNotice] = useState(null);
  const [drinkDialog, setDrinkDialog] = useState(null);
  const socketRef = useRef(null);
  const animationTimersRef = useRef([]);

  const currentCard = game?.currentCard;
  const currentPlayer = game?.currentPlayerName;
  const isGameActive = Boolean(game);
  const gameOver = game?.cardsLeft === 0;
  const canPlay = isGameActive && !gameOver && !cardAnimation && (game.playAsAnyone || currentPlayer === loggedInPlayer);
  const canBet = canPlay && (game.betAnyCard || (currentCard?.value > 5 && currentCard?.value < 11));
  const maxBet = game?.limitBetsToOne ? 1 : 4;

  const sortedGamePlayers = useMemo(() => {
    return [...(game?.players || [])].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }, [game]);

  const showNotice = useCallback((message, tone = "default") => {
    setNotice({message, tone});
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const loadPlayers = useCallback(async () => {
    setLoading((state) => ({...state, players: true}));
    try {
      const data = await api("/api/players");
      setPlayers(data.players || []);
    } finally {
      setLoading((state) => ({...state, players: false}));
    }
  }, []);

  const loadGames = useCallback(async () => {
    setLoading((state) => ({...state, games: true}));
    try {
      const data = await api("/api/games?order-by=_id&dir=asc");
      setGames(data.games || []);
    } finally {
      setLoading((state) => ({...state, games: false}));
    }
  }, []);

  const loadDrinkers = useCallback(async (next = {}) => {
    const state = {...drinkers, ...next};
    setLoading((value) => ({...value, drinkers: true}));
    try {
      const data = await api(`/api/players?order-by=${state.orderBy}&dir=${state.dir}&num=15&start=${state.start}`);
      setDrinkers({...state, players: data.players || [], total: data.total || 0});
    } finally {
      setLoading((value) => ({...value, drinkers: false}));
    }
  }, [drinkers]);

  useEffect(() => {
    preload(["/images/allcards.png", "/images/back.png"]);
    const storedPlayer = getCookie("user");
    if (storedPlayer) {
      setSetup((state) => ({...state, playerName: storedPlayer}));
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length === 1 || parts.length === 2) {
      const [gameId, pathPlayer] = parts;
      const playerName = pathPlayer || storedPlayer;
      if (playerName) {
        void resumeGame(gameId, playerName);
      } else {
        history.replaceState({}, "", "/");
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "drinkers" && drinkers.players.length === 0 && !loading.drinkers) {
      void loadDrinkers({start: 0, orderBy: "maxFingers", dir: "desc"});
    }
  }, [activeTab, drinkers.players.length, loadDrinkers, loading.drinkers]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      animationTimersRef.current.forEach(window.clearTimeout);
    };
  }, []);

  async function resumeGame(gameId, playerName) {
    try {
      const [loadedGame] = await Promise.all([
        api(`/api/games/${gameId}`),
        api(`/api/players/${playerName.toLowerCase()}`)
      ]);
      setSetup((state) => ({
        ...state,
        playerName: playerName.toLowerCase(),
        selectedGameId: gameId,
        selectedGameName: gameLabel(loadedGame),
        mode: "existing"
      }));
      await joinGame(gameId, playerName.toLowerCase(), true);
    } catch {
      history.replaceState({}, "", "/");
    }
  }

  function openPlayerList() {
    setSetupView("players");
    void loadPlayers();
  }

  function openGamePlayerList() {
    setSetupView("gamePlayers");
    void loadPlayers();
  }

  function openGameList() {
    setSetupView("games");
    void loadGames();
  }

  async function createPlayer(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim().toLowerCase();
    if (!name || name.includes("player ")) {
      showNotice("Choose a valid username.", "error");
      return;
    }

    try {
      const player = await api("/api/players", {
        method: "POST",
        body: formBody({
          name,
          firstName: form.get("firstName"),
          surname: form.get("surname")
        })
      });
      selectPlayer(player.name);
      setSetupView("form");
      showNotice(`${player.name} created.`, "success");
    } catch {
      showNotice("That username is already in use or invalid.", "error");
    }
  }

  function selectPlayer(name) {
    setCookie(name);
    setSetup((state) => ({...state, playerName: name, extraPlayers: []}));
  }

  function chooseNewGame() {
    setSetup((state) => ({
      ...state,
      mode: "new",
      selectedGameId: "",
      selectedGameName: "",
      gameName: ""
    }));
  }

  function chooseExistingGame(gameToJoin) {
    setSetup((state) => ({
      ...state,
      mode: "existing",
      selectedGameId: gameToJoin._id,
      selectedGameName: gameLabel(gameToJoin),
      extraPlayers: []
    }));
    setSetupView("form");
  }

  async function startGame() {
    if (!setup.playerName) {
      showNotice("Select or create a player first.", "error");
      return;
    }

    setLoading((state) => ({...state, game: true}));
    try {
      if (setup.mode === "new") {
        const name = setup.gameName.trim() || new Date().toLocaleString([], {dateStyle: "short", timeStyle: "short"});
        const createdGame = await api("/api/games", {
          method: "POST",
          body: formBody({
            name: name.replace(/'/g, ""),
            owner: setup.playerName,
            players: [setup.playerName, ...setup.extraPlayers],
            drinkType: setup.drinkType,
            playAsAnyone: setup.options.playAsAnyone,
            removeCards: setup.options.removeCards,
            wholePack: setup.options.wholePack,
            betAnyCard: setup.options.betAnyCard,
            limitBetsToOne: setup.options.limitBetsToOne
          })
        });
        enterGame(createdGame, setup.playerName);
      } else if (setup.selectedGameId) {
        await joinGame(setup.selectedGameId, setup.playerName);
      } else {
        showNotice("Create or select a game first.", "error");
      }
    } finally {
      setLoading((state) => ({...state, game: false}));
    }
  }

  async function joinGame(gameId, playerName, skipPut = false) {
    const joinedGame = skipPut
      ? await api(`/api/games/${gameId}`)
      : await api(`/api/games/${gameId}/players`, {
        method: "PUT",
        body: formBody({players: [playerName]})
      });

    enterGame(joinedGame, playerName);
  }

  function enterGame(nextGame, playerName) {
    setGame(nextGame);
    setShowMenu(false);
    setLoggedInPlayer(playerName);
    setCurrentBet(0);
    setSelectedStatsPlayer(null);
    connectSocket(nextGame._id, playerName);
    history.replaceState({}, "", `/${nextGame._id}/${playerName}/`);
    setActiveTab("game");
  }

  function connectSocket(gameId, playerName) {
    socketRef.current?.close();
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/${gameId}/${playerName}`);
    socketRef.current = socket;

    const ping = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
        window.setTimeout(ping, 2000);
      }
    };

    socket.addEventListener("open", ping);
    socket.addEventListener("message", (message) => {
      const data = JSON.parse(message.data);
      if (data.playerUpdates) {
        data.playerUpdates.added?.forEach((name) => name !== playerName && showNotice(`${name} joined the game.`, "success"));
        data.playerUpdates.removed?.forEach((name) => name !== playerName && showNotice(`${name} left the game.`));
      }
      if (data.game) {
        setGame(data.game);
        setCurrentBet(0);
        if (data.game.status === false && data.game.fingersToDrink > 0) {
          showNotice(`${data.game.currentPlayerName} drinks ${drinkText(data.game.fingersToDrink, data.game.drinkType)}.`);
        }
      }
    });
    socket.addEventListener("close", (event) => {
      if (!event.wasClean) {
        window.location.reload();
      }
    });
  }

  async function playTurn(guess) {
    if (!game) return;
    const previousPlayer = game.currentPlayerName;
    const previousCard = game.currentCard;
    const nextGame = await api(`/api/games/${game._id}`, {
      method: "PUT",
      body: formBody({
        bet: currentBet,
        guess,
        playerName: game.currentPlayerName,
        loggedInPlayerName: loggedInPlayer
      })
    });

    setCardAnimation({from: previousCard, to: nextGame.currentCard, revealing: false});
    setCurrentBet(0);

    queueAnimationTimer(() => {
      setCardAnimation((animation) => animation ? {...animation, revealing: true} : animation);
    }, 550);

    queueAnimationTimer(() => {
      setGame(nextGame);
      setCardAnimation(null);

      if (nextGame.status === false) {
        queueAnimationTimer(() => {
          setDrinkDialog({
            playerName: previousPlayer,
            amount: nextGame.fingersToDrink,
            type: nextGame.drinkType,
            image: `/images/drink${Math.floor(Math.random() * 6) + 1}.jpg`
          });
        }, 1500);
      }
    }, 1100);
  }

  function queueAnimationTimer(callback, delay) {
    const timer = window.setTimeout(() => {
      animationTimersRef.current = animationTimersRef.current.filter((item) => item !== timer);
      callback();
    }, delay);
    animationTimersRef.current.push(timer);
  }

  async function leaveGame() {
    if (!game || !loggedInPlayer) return;
    await api(`/api/games/${game._id}/players`, {
      method: "PUT",
      body: formBody({playersToRemove: [loggedInPlayer]})
    });
    socketRef.current?.close();
    setGame(null);
    setShowMenu(false);
    setCurrentBet(0);
    setSetup((state) => ({...state, mode: "new", selectedGameId: "", selectedGameName: ""}));
    history.replaceState({}, "", "/");
  }

  async function deleteGame(gameId) {
    await api(`/api/games/${gameId}`, {method: "DELETE"});
    await loadGames();
  }

  async function copyText(text, label) {
    await navigator.clipboard.writeText(text);
    showNotice(`${label} copied.`, "success");
  }

  const copyBase = window.location.href.split("/").slice(0, -2).join("/");
  const joinLinks = sortedGamePlayers
    .filter((player) => player.name !== loggedInPlayer)
    .map((player) => `${player.name}: ${copyBase}/${player.name}`)
    .join("\n");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-amber-100 text-amber-700">
              <Beer size={20} />
            </span>
            Higher or Lower
          </div>
          <nav className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 text-sm">
            <TabButton active={activeTab === "game"} onClick={() => setActiveTab("game")} icon={<Gamepad2 size={16} />}>Game</TabButton>
            <TabButton active={activeTab === "scores"} onClick={() => setActiveTab("scores")} icon={<Grid3X3 size={16} />}>Scores</TabButton>
            <TabButton active={activeTab === "drinkers"} onClick={() => setActiveTab("drinkers")} icon={<Trophy size={16} />}>Top Drinkers</TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4">
        {activeTab === "game" && (
          game && !showMenu ? (
            <GameScreen
              game={game}
              currentBet={currentBet}
              maxBet={maxBet}
              canPlay={canPlay}
              canBet={canBet}
              cardAnimation={cardAnimation}
              onBet={setCurrentBet}
              onPlay={playTurn}
              onBack={() => setShowMenu(true)}
              onLeave={leaveGame}
            />
          ) : (
            <SetupScreen
              view={setupView}
              hasActiveGame={Boolean(game)}
              setup={setup}
              players={players}
              games={games}
              loading={loading}
              onView={setSetupView}
              onCreatePlayer={createPlayer}
              onOpenPlayerList={openPlayerList}
              onOpenGameList={openGameList}
              onOpenGamePlayerList={openGamePlayerList}
              onSelectPlayer={selectPlayer}
              onChooseNewGame={chooseNewGame}
              onChooseExistingGame={chooseExistingGame}
              onDeleteGame={deleteGame}
              onSetupChange={setSetup}
              onStart={startGame}
              onCancelMenu={() => setShowMenu(false)}
            />
          )
        )}

        {activeTab === "scores" && (
          <ScoresScreen
            game={game}
            players={sortedGamePlayers}
            selectedPlayer={selectedStatsPlayer}
            onSelectPlayer={setSelectedStatsPlayer}
            onCopyLinks={() => copyText(joinLinks, "Joining links")}
            onCopyPlayer={(name) => copyText(`${copyBase}/${name}`, `${name} joining link`)}
          />
        )}

        {activeTab === "drinkers" && (
          <DrinkersScreen
            state={drinkers}
            loading={loading.drinkers}
            onSort={(orderBy, dir) => loadDrinkers({orderBy, dir, start: 0})}
            onPage={(direction) => loadDrinkers({start: Math.max(0, drinkers.start + direction * 15)})}
            onReload={() => loadDrinkers()}
          />
        )}
      </main>

      {notice && <Toast notice={notice} />}
      {drinkDialog && <DrinkDialog details={drinkDialog} onClose={() => setDrinkDialog(null)} />}
    </div>
  );
}

function SetupScreen(props) {
  const {
    view,
    setup,
    hasActiveGame,
    players,
    games,
    loading,
    onView,
    onCreatePlayer,
    onOpenPlayerList,
    onOpenGameList,
    onOpenGamePlayerList,
    onSelectPlayer,
    onChooseNewGame,
    onChooseExistingGame,
    onDeleteGame,
    onSetupChange,
    onStart,
    onCancelMenu
  } = props;

  if (view === "newPlayer") {
    return (
      <Panel title="Create player">
        <form className="grid gap-4" onSubmit={onCreatePlayer}>
          <Field label="Username">
            <input className="input lowercase" name="name" maxLength="8" required />
          </Field>
          <Field label="First name">
            <input className="input" name="firstName" />
          </Field>
          <Field label="Surname">
            <input className="input" name="surname" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit"><Check size={16} /> Create</Button>
            <Button type="button" variant="secondary" onClick={() => onView("form")}><ArrowLeft size={16} /> Back</Button>
          </div>
        </form>
      </Panel>
    );
  }

  if (view === "players") {
    return (
      <ListPanel title="Select player" loading={loading.players} onBack={() => onView("form")}>
        {players.map((player) => (
          <button key={player._id} className="list-row text-left" onClick={() => { onSelectPlayer(player.name); onView("form"); }}>
            <span className="font-medium">
              {player.name}
              {(player.firstName || player.surname) && <span className="font-normal text-slate-500"> - {player.firstName} {player.surname}</span>}
            </span>
          </button>
        ))}
      </ListPanel>
    );
  }

  if (view === "games") {
    return (
      <ListPanel title="Select game" loading={loading.games} onBack={() => onView("form")}>
        {games.map((game) => {
          const noCards = game.cardsLeft === 0;
          const canDelete = noCards || game.owner === setup.playerName;
          return (
            <div key={game._id} className="list-row gap-3">
              <button className="min-w-0 flex-1 text-left" disabled={noCards} onClick={() => onChooseExistingGame(game)}>
                <span className={cn("block font-medium", noCards && "line-through")}>{gameLabel(game)}</span>
                <span className="block truncate text-sm text-slate-500">{activePlayers(game).join(", ")}</span>
              </button>
              {canDelete && (
                <Button size="icon" variant="secondary" onClick={() => onDeleteGame(game._id)} aria-label="Delete game">
                  <X size={16} />
                </Button>
              )}
            </div>
          );
        })}
      </ListPanel>
    );
  }

  if (view === "gamePlayers") {
    return (
      <ListPanel title="Choose players" loading={loading.players} onBack={() => onView("form")} backLabel="Done">
        {players.filter((player) => player.name !== setup.playerName).map((player) => {
          const checked = setup.extraPlayers.includes(player.name);
          return (
            <label key={player._id} className="list-row list-row-check cursor-pointer">
              <input
                className="checkbox"
                type="checkbox"
                checked={checked}
                onChange={(event) => onSetupChange((state) => ({
                  ...state,
                  extraPlayers: event.target.checked
                    ? [...state.extraPlayers, player.name]
                    : state.extraPlayers.filter((name) => name !== player.name)
                }))}
              />
              <span className="min-w-0 font-medium">
                {player.name}
                {(player.firstName || player.surname) && <span className="font-normal text-slate-500"> - {player.firstName} {player.surname}</span>}
              </span>
            </label>
          );
        })}
      </ListPanel>
    );
  }

  return (
    <Panel title="New Game" icon={<Beer size={22} />}>
      <div className="grid gap-5">
        <SetupStep title="1. Create a new or select an existing player">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => onView("newPlayer")}><UserPlus size={16} /> New player</Button>
            <Button variant="secondary" onClick={onOpenPlayerList}><Search size={16} /> Existing</Button>
          </div>
          <Readout label="Player" value={setup.playerName || "No player"} selected={Boolean(setup.playerName)} />
        </SetupStep>

        <SetupStep title="2. Create a new or select an existing game">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={setup.mode === "new" ? "default" : "secondary"} onClick={onChooseNewGame}><Plus size={16} /> New game</Button>
            <Button variant={setup.mode === "existing" ? "default" : "secondary"} onClick={onOpenGameList}><Search size={16} /> Existing</Button>
          </div>
          {setup.mode === "new" ? (
            <Field label="Game">
              <input
                className="input"
                placeholder="Optional game name"
                value={setup.gameName}
                onChange={(event) => onSetupChange((state) => ({...state, gameName: event.target.value}))}
              />
            </Field>
          ) : (
            <Readout label="Game" value={setup.selectedGameName || "No game"} selected={Boolean(setup.selectedGameName)} />
          )}
        </SetupStep>

        {setup.mode === "new" && (
          <>
            <SetupStep title="3. Choose other players to join">
              <Button variant="secondary" onClick={onOpenGamePlayerList}><Users size={16} /> Choose players</Button>
              {setup.extraPlayers.length > 0 && <p className="text-sm text-slate-500">{setup.extraPlayers.join(", ")}</p>}
            </SetupStep>

            <SetupStep title="4. What are you drinking?">
              <div className="grid gap-2 sm:grid-cols-2">
                {drinkOptions.map((option) => (
                  <label key={option.id} className="choice">
                    <input
                      type="radio"
                      name="drink"
                      checked={setup.drinkChoice === option.id}
                      onChange={() => onSetupChange((state) => ({...state, drinkChoice: option.id, drinkType: option.value}))}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </SetupStep>

            <SetupStep title="5. Select other game options">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["playAsAnyone", "Play as anyone"],
                  ["betAnyCard", "Bet on any card"],
                  ["removeCards", "Remove played cards"],
                  ["limitBetsToOne", "Limit bets to 1"],
                  ["wholePack", "Use the whole pack"]
                ].map(([key, label]) => (
                  <label key={key} className="choice">
                    <input
                      type="checkbox"
                      checked={setup.options[key]}
                      onChange={(event) => onSetupChange((state) => ({
                        ...state,
                        options: {...state.options, [key]: event.target.checked}
                      }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </SetupStep>
          </>
        )}

        <Button className="w-full" disabled={loading.game} onClick={onStart}>
          {loading.game ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          {setup.mode === "existing" ? "Join game" : "Start game"}
        </Button>
        {hasActiveGame && (
          <Button className="w-full" variant="secondary" onClick={onCancelMenu}>
            <ArrowLeft size={16} /> Back to game
          </Button>
        )}
      </div>
    </Panel>
  );
}

function GameScreen({game, currentBet, maxBet, canPlay, canBet, cardAnimation, onBet, onPlay, onBack, onLeave}) {
  const card = cardAnimation ? (cardAnimation.revealing ? cardAnimation.to : cardAnimation.from) : game.currentCard;
  const resultClass = game.status === true ? "bg-emerald-100" : game.status === false ? "bg-red-100" : "bg-white";

  return (
    <section className="grid gap-4">
      <div className="status-bar">
        {game.cardsLeft === 0 ? <strong>GAME OVER</strong> : <span><strong>{game.currentPlayerName}</strong> guess higher or lower</span>}
      </div>

      <div className="rounded-md border bg-white p-3 shadow-sm">
        <div className="mb-3 h-12">
          {canBet && (
            <label className="grid gap-2 text-sm font-medium">
              Bet: {currentBet}
              <input type="range" min="0" max={maxBet} value={currentBet} onChange={(event) => onBet(Number(event.target.value))} />
            </label>
          )}
        </div>

        <div className={cn("grid min-h-[320px] place-items-center rounded-md border transition-colors", resultClass)}>
          {card && <CardFace card={card} spinning={Boolean(cardAnimation)} />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={!canPlay} onClick={() => onPlay(true)}><ArrowUp size={18} /> Higher</Button>
          <Button disabled={!canPlay} variant="secondary" onClick={() => onPlay(false)}><ArrowDown size={18} /> Lower</Button>
        </div>
      </div>

      <div className="footer-bar">
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <Button variant="destructive" onClick={onLeave}>Quit game</Button>
        <div className="stat-pill">Bet: {game.bet}</div>
        <div className="stat-pill">{game.cardsLeft} {game.cardsLeft === 1 ? "card" : "cards"}</div>
      </div>
    </section>
  );
}

function ScoresScreen({game, players, selectedPlayer, onSelectPlayer, onCopyLinks, onCopyPlayer}) {
  if (!game) {
    return <Panel title="Scores"><p className="text-center font-semibold text-slate-500">No Game In Progress</p></Panel>;
  }

  if (selectedPlayer) {
    const stats = selectedPlayer.stats || {};
    return (
      <Panel title={selectedPlayer.name}>
        <div className="grid gap-3 text-sm">
          <Stat label="Guesses made" value={stats.guesses?.length || 0} />
          <Stat label="Correct guesses" value={stats.numCorrectGuesses || 0} />
          <Stat label="Incorrect guesses" value={stats.numIncorrectGuesses || 0} />
          <Stat label="Percentage correct" value={`${stats.percentageCorrect || "0.0"}%`} />
          <Stat label="Most correct guesses in a row" value={stats.correctGuessStreak || 0} />
          <Stat label="Most incorrect guesses in a row" value={stats.incorrectGuessStreak || 0} />
          <Stat label={`Most ${game.drinkType}s drank`} value={stats.fingersDrank || 0} />
          <Button variant="secondary" onClick={() => onSelectPlayer(null)}><ArrowLeft size={16} /> Back</Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={gameLabel(game)}>
      <div className="mb-3">
        <Button variant="secondary" onClick={onCopyLinks}><Copy size={16} /> Copy joining links</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="score-table">
          <tbody>
            {players.map((player, index) => (
              <tr key={player.name} className={!player.active ? "opacity-60" : undefined}>
                <td className="rank-cell">{index + 1}.</td>
                <th>
                  <button className="player-chip" onClick={() => onSelectPlayer(player)}>
                    {game.cardsLeft === 0 && index === 0 ? <Crown size={14} /> : <Trophy size={14} />}
                    {player.name}
                  </button>
                </th>
                <td>
                  <Button size="icon" variant="ghost" onClick={() => onCopyPlayer(player.name)} aria-label={`Copy ${player.name} joining link`}>
                    <Copy size={16} />
                  </Button>
                </td>
                {(player.stats?.guesses || []).map((correct, guessIndex) => (
                  <td key={guessIndex} className={correct ? "guess-correct" : "guess-incorrect"}>{guessIndex + 1}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DrinkersScreen({state, loading, onSort, onPage, onReload}) {
  const columns = [
    ["name", "Name", "asc"],
    ["maxFingers", "Fingers drank", "desc"],
    ["maxCorrect", "Correct guesses", "desc"],
    ["maxIncorrect", "Incorrect guesses", "desc"]
  ];

  return (
    <Panel title="Top Drinkers">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(([key, label, defaultDir]) => (
                <th key={key}>
                  <button onClick={() => onSort(key, state.orderBy === key && state.dir === "desc" ? "asc" : defaultDir)}>
                    {label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.players.map((player, index) => (
              <tr key={player._id}>
                <td>{state.start + index + 1}</td>
                <td>{player.name}</td>
                <td>{player.maxFingers}</td>
                <td>{player.maxCorrect}</td>
                <td>{player.maxIncorrect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="grid place-items-center py-6"><Loader2 className="animate-spin" /></div>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="secondary" disabled={state.start === 0} onClick={() => onPage(-1)}><ArrowLeft size={16} /> Prev</Button>
        <Button variant="secondary" onClick={onReload}><RefreshCw size={16} /> Reload</Button>
        <Button disabled={state.start + 15 >= state.total} onClick={() => onPage(1)}>Next <ArrowRight size={16} /></Button>
      </div>
    </Panel>
  );
}

function DrinkDialog({details, onClose}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-sm rounded-md bg-white p-4 text-center shadow-xl">
        <div className="mb-3 flex items-center justify-center gap-2 text-lg font-semibold">
          <Beer className="text-amber-600" /> Drink
        </div>
        <img className="mx-auto size-56 rounded-md object-cover" src={details.image} alt="" />
        <p className="my-4 text-lg">
          <strong>{details.playerName}</strong> you must drink<br />
          <span className="text-2xl font-bold text-red-600">{details.amount > 0 ? drinkText(details.amount, details.type) : "\u00a0"}</span>
        </p>
        <Button className="w-full" onClick={onClose}><Check size={16} /> Drinking complete</Button>
      </div>
    </div>
  );
}

function Panel({title, icon, children}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h1 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">{icon}{title}</h1>
      {children}
    </section>
  );
}

function ListPanel({title, loading, onBack, backLabel = "Back", children}) {
  return (
    <Panel title={title}>
      <Button className="mb-3 w-full" variant="secondary" onClick={onBack}><ArrowLeft size={16} /> {backLabel}</Button>
      <div className="grid gap-2">
        {loading ? <Loader2 className="mx-auto my-8 animate-spin" /> : children}
      </div>
      <Button className="mt-3 w-full" variant="secondary" onClick={onBack}><ArrowLeft size={16} /> {backLabel}</Button>
    </Panel>
  );
}

function SetupStep({title, children}) {
  return <section className="grid gap-3 border-b border-slate-200 pb-4 last:border-0 last:pb-0"><h2 className="font-semibold">{title}</h2>{children}</section>;
}

function Field({label, children}) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700">{label}{children}</label>;
}

function Readout({label, value, selected}) {
  return <div className="flex items-center gap-2 text-sm"><span className="text-slate-500">{label}:</span><strong className={selected ? "text-sky-700" : "text-slate-400"}>{value}</strong></div>;
}

function TabButton({active, icon, children, ...props}) {
  return (
    <button className={cn("flex items-center justify-center gap-1.5 rounded px-2 py-1.5 font-medium sm:px-3", active ? "bg-white shadow-sm" : "text-slate-600")} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function CardFace({card, spinning}) {
  return <div className={cn("card-face", spinning && "card-face-spinning")} style={{backgroundPosition: cardCoords(card)}} aria-label={`${card.value} of ${card.suit}`} />;
}

function Toast({notice}) {
  return <div className={cn("fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-md px-4 py-3 text-sm font-medium shadow-lg", notice.tone === "error" ? "bg-red-600 text-white" : notice.tone === "success" ? "bg-emerald-600 text-white" : "bg-slate-950 text-white")}>{notice.message}</div>;
}

function Stat({label, value}) {
  return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>;
}

function api(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      ...(options.headers || {})
    }
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  });
}

function formBody(data) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => body.append(`${key}[]`, item));
    } else {
      body.append(key, value);
    }
  });
  return body;
}

function gameLabel(game) {
  return `${game.name} [${game.owner}]`;
}

function activePlayers(game) {
  return (game.players || []).filter((player) => player.active).map((player) => player.name);
}

function cardCoords(card) {
  const suitY = {clubs: 0, diamonds: -232, hearts: -464, spades: -696};
  const x = (Number(card.value) - 2) * -160;
  return `${x}px ${suitY[card.suit] || 0}px`;
}

function drinkText(amount, type) {
  return `${amount} ${type}${amount === 1 ? "" : "s"}`;
}

function preload(images) {
  images.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}

function setCookie(playerName) {
  const expires = new Date(Date.now() + 86400000).toUTCString();
  document.cookie = `user=${playerName};expires=${expires};path=/`;
}

function getCookie(name) {
  return document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.split("=")[1];
}

createRoot(document.getElementById("root")).render(<App />);
