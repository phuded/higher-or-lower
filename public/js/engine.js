$.prepareGame = function(){

	//Get player list
    $.getPlayerList();

	$('#drink').live('pageshow',function(event){
		var fingers = $("#numFingers");
		fingers.animate({fontSize:'3.0em'}, 400);
		fingers.animate({fontSize:'1.0em'}, 300);
		
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

    const url = wsProtocol + "://" +  location.host  + "/ws/" + GAME_ID;

    WS_CONNECTION = new WebSocket(url);

    WS_CONNECTION.onopen = function () {
        // connection is opened and ready to use

        console.log("Listening on: " + url);
    };

    WS_CONNECTION.onerror = function (error) {
        // an error occurred when sending/receiving data
    };

    WS_CONNECTION.onmessage = function (message) {

        try {

            const res = JSON.parse(message.data);

            const prevPlayer = res.prevPlayer;
            
            const game = res.game;

            // Don't refresh if same
            if((game.currentPlayerName !== CURRENT_PLAYER) || (game.currentCard.suit !== CURRENT_CARD.suit) || (game.currentCard.value !== CURRENT_CARD.value)) {

                //Updated!

                //Remove colour from background
                $("#cardDisplay").removeClass('green red');

                //Reset bet counter
                $("#currentNumFingers").val(0).slider("refresh");

                // Only show animation for logged in player
                const skipAnimation = prevPlayer !=  LOGGED_IN_PLAYER;

                //Display card
                $.displayCard(game.currentCard, game.cardsLeft, game.status, game.currentPlayerName, game.bet, game.fingersToDrink, game.players, skipAnimation);

                //Finally make the current card the next one
                CURRENT_CARD = game.currentCard;

            }

        } catch (e) {

            console.log("Invalid data: ", message.data);

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

	var players = [];

	//Set players in array
	players.push(selectedPlayerName);

    // Set the logged in player!
    LOGGED_IN_PLAYER = selectedPlayerName;

	//Hide any current card
	$("#cardDisplay").removeClass('green red');


	if(!GAME_ID || !$("#selectedGameName").val()){

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
        url: "api/games",
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

            CURRENT_CARD = game.currentCard;

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
                $.displayCard(CURRENT_CARD, game.cardsLeft);

                //Reset bet counter
                $("#totalNumFingers").text("0");

                //Reset bet slider
                $("#currentNumFingers").val(0).slider("refresh");

                $("#gameTitle").text(game.name + " [Created by: " + game.owner + "]");

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
        url: "api/games/" + GAME_ID + "/players",
        data: {
            "players" : players
        },
        dataType: "json",
        success: function(game){
            //Updated!

            GAME_ID = game._id;

            $.websocketListen();

            CURRENT_CARD = game.currentCard;

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
                $.displayCard(CURRENT_CARD, game.cardsLeft);

                // Scores - skip updates as just joining
                $.updateTurnScores(game.players, CURRENT_BET, game.fingersToDrink, true);

                //Reset bet slider
                $("#currentNumFingers").val(0).slider("refresh");

                $("#gameTitle").text(game.name + " [Created by: " + game.owner + "]");

            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            // Error!
        }
    });

};

$.playTurn = function(higherGuess){

	//Remove colour from background
	$("#cardDisplay").removeClass('green red');

	//Get slider
	var currentBet = parseInt($("#currentNumFingers").val());

	//Reset bet counter
	$("#currentNumFingers").val(0).slider("refresh");

	$.ajax({
		type: "PUT",
		url: "api/games/" + GAME_ID,
		data: {
		    "bet": currentBet,
			"guess" : higherGuess,
			"playerName" : CURRENT_PLAYER
		},
		dataType: "json",
		success: function(res){
            //Nothing
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Nothing
		}
	});

};



//Display the card
$.displayCard = function(card, cardsLeft, correctGuess, nextPlayer, bet, fingersToDrink, players, skipAnimation){

	//Card number
	var cardNum = parseInt(card.value);

	//Card image
	var cardImg = $("#card");
	
	//Not first card - flipping
	if(correctGuess !== undefined){

		//Hide slider if bet on any card is off
		if(!BET_ANY_CARD){

			$("#sliderBar").hide();

		}
		//Rotate card and display new one
		cardImg.rotate3Di(
			360,
			900,
			{
				sideChange: function(front) {
					if (front) {
						//Replace image
						$(this).css('background','url(images/allcards.png) no-repeat '+$.getCardCoords(card));			
					} else {
						//Make back of card the pack;
						$(this).css('background','url(images/allcards.png) no-repeat 0px -928px');
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
					
						//Show Lee
						if(!skipAnimation){

                            if(fingersToDrink > 0){
                                $("#drinkMessage").html("<b>"+ CURRENT_PLAYER + "</b> you must drink...<br/><span id='numFingers'>"+(fingersToDrink > 1?fingersToDrink + " " + DRINK_TYPE + "s!":fingersToDrink + " " + DRINK_TYPE + "!")+"</span>");
                            }
                            else{
                                $("#drinkMessage").html("<b>"+ CURRENT_PLAYER + "</b> you must drink...<br/>&nbsp;");

                            }

                            const randomNum = Math.floor(Math.random() * 5) + 1;

                            $(".pictureDisplay").hide();
                            $("#pictureDisplay" + randomNum).show();

                            //Show Lee
                            setTimeout('$.openDialog()',150);
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
		cardImg.css('background', "url(images/allcards.png) no-repeat " + $.getCardCoords(card));
		cardImg.show();

        $.changePermissions(cardNum, cardsLeft);
	}


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
        url: "api/games/" + GAME_ID + "/players",
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
 

$.preLoadImages = function(imageList, callback) {
		var pic = [], i, total, loaded = 0;
		if (typeof imageList != 'undefined') {
			if ($.isArray(imageList)) {
				total = imageList.length; // used later
					for (i=0; i < total; i++) {
						pic[i] = new Image();
						pic[i].onload = function() {
							loaded++; // should never hit a race condition due to JS's non-threaded nature
							if (loaded == total) {
								if ($.isFunction(callback)) {
									callback();
								}
							}
						};
						pic[i].src = imageList[i];
					}
			}
			else {
				pic[0] = new Image();
				pic[0].onload = function() {
					if ($.isFunction(callback)) {
						callback();
					}
				}
				pic[0].src = imageList;
			}
		}
		pic = undefined;
};

function playAsAnyoneChecked(){

    const playAsAnyone = $("#playAsAnyone").attr('checked');

    if(playAsAnyone === "checked"){

        return true;
    }

    return false;
};


function removeCardChecked(){

   const remove = $("#removeCards").attr('checked');

   if(remove === "checked"){

   		return true;
   }

   return false;
};

function useWholePackChecked(){

    const wholePack = $("#wholePack").attr('checked');

    if(wholePack === "checked"){

        return true;
    }

    return false;
};

function betAnyCardChecked(){

    const fullBetting = $("#fullBetting").attr('checked');

    if(fullBetting === "checked"){

        return true;
    }

    return false;
};



//Game variables
var CURRENT_CARD;

var LOGGED_IN_PLAYER;

var CURRENT_PLAYER;

var CURRENT_BET = 0;

var BET_ANY_CARD = false;

var PLAY_AS_ANYONE = false;

//Drink type
var DRINK_TYPE;

var GAME_ID;

//Number of drinkers displayed in table
var MAX_DRINKER_ROWS = 10;

//Images to preload
var PRELOAD_IMAGES =['images/allcards.png'];

// Websocket connection
var WS_CONNECTION;