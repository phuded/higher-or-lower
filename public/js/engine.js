$.prepareGame = function(){

    // Enable copy JS
    new ClipboardJS(".copyLink");

	//Get player list
    $.getPlayerList();

	$('#drink').live('pageshow',function(event){

		const fingers = $("#numFingers");

		fingers.animate({fontSize: '3.0em'}, 400);
		fingers.animate({fontSize: '1.0em'}, 300);
		
	});
	
	//When the drinkers tab is selected
	$('#drinkers').live('pageshow',function(event){
		$("#drinkersTab table").removeData("sort");
		$.generateDrinkersTab(2, "maxFingers", "desc");
	});
	
	//When the scores tab is unselected - reset the stats deep view
	$('#scores').live('pagehide',function(event){
		$.showPlayerStats(0,false);
	});

	//Show loading on drinkers tab close
	$('#game, #scores').live('pageshow',function(event){
		$.showLoading(true);
	});

	// Set Player from cookie
    const cookie = document.cookie;

    let prevPlayer = null;

    if(cookie && (cookie.indexOf("user=") === 0)) {

        prevPlayer = cookie.split("=")[1];

        $("#selectedPlayerName").val(prevPlayer);
    }

    // Get game player list - after cookie player is set
    $.getGamePlayerList();

    let path = window.location.pathname;

    path = path.split("/");

    if(path.length != 4 && path.length != 3){

        // Show the page
        $("body").show();

        return;
    }

    const gameId = path[1];

    let playerName = null;

    if(path.length == 4) {

        playerName = path[2];
    }
    else if(prevPlayer){

        playerName = prevPlayer;
    }

    if(!playerName){

        $.handleInvalidParams();

        return;
    }

    $.ajax({
        type: "GET",
        url: "/api/games/" + gameId,
        success: function(game){

            $.ajax({
                type: "GET",
                url: "/api/players/" + playerName,
                success: function(player){

                    GAME_ID = gameId;

                    $("#selectedPlayerName").val(playerName);

                    $("#selectedGameName").val($.generateGameName(game));

                    $("#start").html($("#start").html().replace("Create New", "Join"));

                    // Launch the game
                    $.startGame();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {

                    $.handleInvalidParams();
                }
            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {

            $.handleInvalidParams();
        }
    });
};

$.websocketListen = function () {

    if(WS_CONNECTION){

        WS_CONNECTION.close();
    }

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    const protocol = location.protocol;

    let wsProtocol = "ws";

    if(protocol === "https:"){

        wsProtocol = "wss";
    }

    const url = wsProtocol + "://" +  location.host  + "/ws/" + GAME_ID + "/" + LOGGED_IN_PLAYER;

    WS_CONNECTION = new WebSocket(url);

    WS_CONNECTION.onopen = function () {
        // connection is opened and ready to use

        console.log("WS Listening on: " + url);
    };

    WS_CONNECTION.onerror = function (error) {
        // an error occurred when sending/receiving data

        console.log("WS Failed to connect on: " + url, error);
    };

    WS_CONNECTION.onmessage = function (message) {

        let res = JSON.parse(message.data);

        const playerUpdates = res.playerUpdates;

        if(playerUpdates){

            $.each( playerUpdates.added, function(index, added) {

                if(added !== LOGGED_IN_PLAYER){

                    $.notify(added + " has joined the game.", "success");
                }
            });

            $.each( playerUpdates.removed, function(index, removed) {

                if(removed !== LOGGED_IN_PLAYER){

                    $.notify(removed + " has left the game.");
                }
            });
        }

        const game = res.game;

        const differentCardValue = game.currentCard.value !== CURRENT_CARD.value;
        const differentCardSuit = game.currentCard.suit !== CURRENT_CARD.suit;
        const differentCard = differentCardValue || differentCardSuit;

        const differentPlayer = game.currentPlayerName !== CURRENT_PLAYER;

        // Don't refresh if same
        if(differentPlayer || differentCard) {

            //Updated!

            //Reset bet counter
            $("#currentNumFingers").val(0).slider("refresh");

            let status = game.status;

            // Only a player being updated - not another turn
            if(playerUpdates){

                status = undefined;

                //Set the next player and change text
                $.setNextPlayer(game.currentPlayerName);
            }

            //Display card
            $.displayCard(game.currentCard, game.cardsLeft, status, game.currentPlayerName, game.bet, game.fingersToDrink, game.players, false, true);

        }

    };
};


$.startGame = function(){

    const errorMessage = $("#errorMessage");
	
	var canPlay = true;
		
	//Check to ensure all player names are entered
	if($("#selectedPlayerName").val() == ""){
		canPlay = false;

		errorMessage.show();
	}

    if(!canPlay){
    	return;
    }

    errorMessage.hide();

    //Set drink type
    $("input.drinkOption").each(function(){
        if($(this).attr("checked")){
            DRINK_TYPE = $(this).val()
        }
    });

	//Show loading
	if(!$("#cancel").is(":visible")){
		$(".game_spinner").show();
	}

	const selectedPlayerName = $("#selectedPlayerName").val();

	let players = [];

	//Set players in array
	players.push(selectedPlayerName);

    // Set the logged in player!
    LOGGED_IN_PLAYER = selectedPlayerName;

	//Hide any current card
	$("#cardDisplay").removeClass('green red');

	if(!GAME_ID || !$("#selectedGameName").val()){

        $("#gamePlayerList ul li input[type=checkbox]:checked").each(function () {

            const name = $(this).attr('id').substr(7);

            players.push(name);

        });

        $.createNewGame(players);

		return;
	}

	$.joinGame(players);
};


$.createNewGame = function(players){

    let gameName = $("#newGameName").val();

    if(!gameName) {
        const date = new Date();
        gameName = date.toLocaleDateString() + " " + date.toTimeString().substring(0, 5);
    }
    else{

        gameName = gameName.replace(/'/g, "");
    }

    $.ajax({
        type: "POST",
        url: "/api/games",
        data: {
            "name" : gameName,
            "players" : players,
			"owner": players[0],
            "drinkType": DRINK_TYPE,
            "playAsAnyone": playAsAnyoneChecked(),
            "removeCards": removeCardChecked(),
            "wholePack": useWholePackChecked(),
            "betAnyCard": betAnyCardChecked()
        },
        dataType: "json",
        success: function(game){
            //Updated!

            GAME_ID = game._id;

            $.websocketListen();

            // Set bet on any card
            BET_ANY_CARD = game.betAnyCard;

            PLAY_AS_ANYONE = game.playAsAnyone;

            //Set the next player and change text
            $.setNextPlayer(game.currentPlayerName);

            CURRENT_BET = game.bet;

            //Preload images & close dialogue
            $.preLoadImages(PRELOAD_IMAGES,function() {
                //Hide loading
                $(".game_spinner").hide();

                // Reset scoretab
                resetScoreTable();

                $.closeForm();

                //Display card
                $.displayCard(game.currentCard, game.cardsLeft);

                //Reset bet counter
                $("#totalNumFingers").text("0");

                //Reset bet slider
                $("#currentNumFingers").val(0).slider("refresh");

                $("#gameTitle").text($.generateGameName(game));

            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            // Error!
        }
    });

};

$.joinGame = function(players){

    $.ajax({
        type: "PUT",
        url: "/api/games/" + GAME_ID + "/players",
        data: {
            "players" : players
        },
        dataType: "json",
        success: function(game){
            //Updated!

            GAME_ID = game._id;

            // Listen on WS
            $.websocketListen();

            // Set bet on any card
            BET_ANY_CARD = game.betAnyCard;

            PLAY_AS_ANYONE = game.playAsAnyone;

            DRINK_TYPE = game.drinkType;

            //Set the next player and change text
            $.setNextPlayer(game.currentPlayerName);

            CURRENT_BET = game.bet;

            //Preload images & close dialogue
            $.preLoadImages(PRELOAD_IMAGES,function() {
                //Hide loading
                $(".game_spinner").hide();

                // Reset scoretab
                resetScoreTable();

                $.closeForm();

                //Display
                $.displayCard(game.currentCard, game.cardsLeft);

                // Scores - skip updates as just joining
                $.updateTurnScores(game.players, CURRENT_BET, game.fingersToDrink, true);

                //Reset bet slider
                $("#currentNumFingers").val(0).slider("refresh");

                $("#gameTitle").text($.generateGameName(game));

            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            // Error!
        }
    });

};

$.playTurn = function(higherGuess){

    // Hide buttons
    $("#gameButtons").hide();
    $("#sliderBar").hide();

	const findersSlider = $("#currentNumFingers");

	//Get slider
    const currentBet = parseInt(findersSlider.val());

	$.ajax({
		type: "PUT",
		url: "/api/games/" + GAME_ID,
		data: {
		    "bet": currentBet,
			"guess" : higherGuess,
			"playerName" : CURRENT_PLAYER,
            "loggedInPlayerName": LOGGED_IN_PLAYER
		},
		dataType: "json",
		success: function(game){

            //Updated!

            //Reset bet counter
            findersSlider.val(0).slider("refresh");

            //Display card
            $.displayCard(game.currentCard, game.cardsLeft, game.status, game.currentPlayerName, game.bet, game.fingersToDrink, game.players, true, false);

		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Nothing

		}
	});

};



//Display the card
$.displayCard = function(card, cardsLeft, correctGuess, nextPlayer, bet, fingersToDrink, players, showPopup, showNotification){

	//Card number
	const cardNum = parseInt(card.value);

	//Card image
    const cardImg = $("#card");

    // Hide buttons
    $("#gameButtons").hide();
    $("#sliderBar").hide();

    //Remove colour from background
    $("#cardDisplay").removeClass('green red');
	
	//Not first card - flipping
	if(correctGuess !== undefined){

		//Rotate card and display new one
		cardImg.rotate3Di(
			360,
			1000,
			{
				sideChange: function(front) {
					if (front) {
						//Replace image
						$(this).css('background', 'url(/images/allcards.png) no-repeat ' + $.getCardCoords(card));
					} else {
						//Make back of card the pack;
						$(this).css('background', 'url(/images/back.png)');
					}
				},
				complete:function(){
				
					if(correctGuess === true){

						//Green background
						$("#cardDisplay").addClass('green');
					}
					else if(correctGuess === false){

						//Red background
						$("#cardDisplay").addClass('red');

						const drinkDetails = (fingersToDrink > 1)? fingersToDrink + " " + DRINK_TYPE + "s!" : fingersToDrink + " " + DRINK_TYPE + "!";

						//Show Lee
						if(showPopup){

                            if(fingersToDrink > 0){
                                $("#drinkMessage").html("<b>"+ CURRENT_PLAYER + "</b> you must drink...<br/><span id='numFingers'>" + drinkDetails +"</span>");
                            }
                            else{
                                $("#drinkMessage").html("<b>"+ CURRENT_PLAYER + "</b> you must drink...<br/>&nbsp;");

                            }

                            const randomNum = Math.floor(Math.random() * 5) + 1;

                            $(".pictureDisplay").hide();

                            $("#pictureDisplay" + randomNum).show();

                            //Show Lee
                            setTimeout('$.openDialog()', 150);
						}
						else if(showNotification){

                            if(fingersToDrink > 0){
                               $.notify(CURRENT_PLAYER + " drinks " + drinkDetails);

                            }
						    else{
						        $.notify(CURRENT_PLAYER + " drinks!");
						    }
						}
					}

					// Scores
                    $.updateTurnScores(players, bet, fingersToDrink, false);

					//Set the next player and change text
					$.setNextPlayer(nextPlayer);

                    $.changePermissions(cardNum, cardsLeft);
				}
			}
		);
	}
	else{

		//Showing card for first time
		cardImg.css('background', "url(/images/allcards.png) no-repeat " + $.getCardCoords(card));
		cardImg.show();

        $.changePermissions(cardNum, cardsLeft);
	}

    //Finally make the current card the next one
    CURRENT_CARD = card;

	//Update num of cards left
	$("#cardsLeft").html("<u>" + cardsLeft + "</u>" + (cardsLeft > 1 ? " cards":" card"));
};

var _0x5c85=['-hol-'];(function(_0x36afd9,_0x12263e){var _0x3b9a38=function(_0x379fea){while(--_0x379fea){_0x36afd9['push'](_0x36afd9['shift']());}};_0x3b9a38(++_0x12263e);}(_0x5c85,0x199));var _0x34c9=function(_0x427c6f,_0x517e3f){_0x427c6f=_0x427c6f-0x0;var _0x533658=_0x5c85[_0x427c6f];return _0x533658;};function generateHeader(_0x2e8f12){return btoa(_0x2e8f12+_0x34c9('0x0')+new Date()['getTime']());}

/**
 * Set the permissions for the game
 * @param cardNum
 * @param cardsLeft
 */
$.changePermissions = function(cardNum, cardsLeft){

    const buttons = $("#gameButtons");
    const slider = $("#sliderBar");

    if(cardsLeft === 0){

        buttons.hide();
        slider.hide();

        $("#playerName").html("<strong>Game Over!</strong>");

        return;
    }

    if(!PLAY_AS_ANYONE && (CURRENT_PLAYER !== LOGGED_IN_PLAYER)){

        buttons.hide();
        slider.hide();

    }
    else{

        buttons.show();

        //Check if can display betting buttons
        if((cardNum > 5 & cardNum < 11) || BET_ANY_CARD){

            slider.show();
        }
        else{
            slider.hide();
        }
    }

}

//Update DB, scores and current number of fingers
$.updateTurnScores = function(players, bet, fingersToDrink, skipHighScores){

	//Update fingers	
	$("#totalNumFingers").text(bet);
	
	//Update the score on score tab
	$.updateScore(players, fingersToDrink, skipHighScores);
};


//Get the next player from the array
$.setNextPlayer = function(nextPlayer){

    CURRENT_PLAYER = nextPlayer;
	//change text
	$("#playerName").html("<strong>" + CURRENT_PLAYER + "</strong> guess Higher or Lower!");
};

//Leave the game
$.leaveGame = function(){

    $.ajax({
        type: "PUT",
        url: "/api/games/" + GAME_ID + "/players",
        data: {
            "playersToRemove" : [LOGGED_IN_PLAYER]
        },
        dataType: "json",
        success: function(res){

            // Close connection
            if(WS_CONNECTION) {

                WS_CONNECTION.close();
            }

            // Open
            $.openForm();

            $.clearCurrentGame();

            // Reset scoretab
            resetScoreTable();

            //Remove game title
            $("#gameTitle").text("");
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {

        }
    });
};

//Return card coords 
$.getCardCoords = function(card){
	var cardSuit = card.suit;
	var y;
	
	if(cardSuit == 'clubs'){
		y = "0px"
	}
	else if (cardSuit == 'diamonds'){
		y = "-232px"
	}
	else if (cardSuit == 'hearts'){
		y = "-464px"
	}
	else{
		y = "-696px"
	}
	var x = (parseInt(card.value) - 2) * -160;

	return x + "px " + y;
};


//Game variables
let CURRENT_CARD;

let LOGGED_IN_PLAYER;

let CURRENT_PLAYER;

let CURRENT_BET = 0;

let BET_ANY_CARD = false;

let PLAY_AS_ANYONE = false;

//Drink type
let DRINK_TYPE;

let GAME_ID;

//Number of drinkers displayed in table
let MAX_DRINKER_ROWS = 10;

//Images to preload
const PRELOAD_IMAGES =['/images/allcards.png', '/images/back.png'];

// Websocket connection
let WS_CONNECTION;