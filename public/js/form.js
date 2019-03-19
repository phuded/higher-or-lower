$.showNewGameForm = function(show){

    if(show) {

        $("#newGameForm").show();
        $("#ng").addClass("selected");
        $("#eg").removeClass("selected");

        // Clear any existing game
        GAME_ID = null;

        // Hide cancel
        $("#cancel").hide();

        const gameName = $("#gameName");

        gameName.val("");
        gameName.attr("readonly", null);
        gameName.removeClass("selected");

        $("#start").html($("#start").html().replace("Join", "Start"));

        return;
    }

    // Hide the new game form
    $("#newGameForm").hide();
};

/* NEW PLAYER */
$.createNewPlayer = function(show, player){

	const formContent = $(".gameForm");
	const playerForm = $("#playerForm");

	const errorMessage = $("#playerFormErrorMessage");

	// Show Create Form
	if(show){

		formContent.fadeOut(function() {
			playerForm.fadeIn('fast');
		 });

		 return;
	}

    //Clear warning
    errorMessage.hide();

    // Cancel
    if(!player){

        //Cancel and show main form
        playerForm.fadeOut(function() {

            formContent.fadeIn('fast');

            //Clear form
            $.clearNewPlayerForm();
        });

        return;
    }

    //Call method to create player and display main form if 2nd argument true
    const pName = $("#pname");

    //Get username
    const playerName = pName.val().trim();

    const playerNameValid = (playerName.length > 0) && (playerName.indexOf("Player ") == -1);

    if(!playerNameValid){

        //Invalid in use - clear name and show warning
        pName.val("");
        errorMessage.show();

        return
    }

    const createPlayerButton = $("#createPlayer");
    const cancelPlayerButton = $("#cancelPlayer");
    const playerSpinner = $(".player_spinner");

    createPlayerButton.hide();
    cancelPlayerButton.hide();

    playerSpinner.show();

    const fName = $("#fname").val();
    const surname = $("#surname").val();

    //Add new player
    $.ajax({
        type: "POST",
        url: "/api/players",
        data: {	name: playerName,
                firstName: fName,
                surname: surname
        },
        dataType: "json",
        success: function(player){

            //Added!
            //Refresh player list
            $.getPlayerList();

            //Show previous screen
            playerForm.fadeOut(function() {

                createPlayerButton.show();
                cancelPlayerButton.show();
                playerSpinner.hide();

                $("#selectedPlayerName").val(player.name);

                $("#np").addClass("selected");
                $("#ep").removeClass("selected");

                $.clearNewPlayerForm();

                // Reload
                $.getGamePlayerList();

                // Remove main form error
                $("#errorMessage").hide();

                formContent.fadeIn('fast');

            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {

            // Error!
            //Already in use - clear name and show warning
            pName.val("");
            errorMessage.show();

            return;
        }
    });

};

/*Clear new player form */

$.clearNewPlayerForm = function(){
	$(".playerFormField").val("");
};


/* PLAYERS */
$.showPlayerList = function(show, player){

    const formContent = $(".gameForm");
    const playerList = $("#playerList");

    if(show){

        formContent.fadeOut(function() {
            playerList.fadeIn('fast');
        });

        return;

    }

    playerList.fadeOut(function() {

        formContent.fadeIn('fast');

        if(player != null){

            // Player selected
            $("#selectedPlayerName").val(player);

            $("#ep").addClass("selected");
            $("#np").removeClass("selected");

            // Store in cookie
            $.setCookie(player);

            $("#errorMessage").hide();

            // Get game player list
            $.getGamePlayerList();

        }
    });

};

$.setCookie = function(playerName){

    const date = new Date();
    date.setTime(date.getTime() + (1 * 86400000));

    const expires = "expires=" + date.toUTCString();

    document.cookie = "user=" + playerName + ";" + expires + ";path=/";
};


/* Get List of players */
/* TODO: Fix complete */
$.getPlayerList = function(completeFunction){

    const playerList = $("#playerList ul");

    playerList.html("");

    //Get Player List
    $.ajax({
        type: "GET",
        url: "/api/players",
        success: function(json){

            const players = json.players;

            let options = "";

            for (let i = 0; i < players.length; i++) {

                const name = players[i].name;

                const wName = players[i].fname ?" (" + players[i].fname.substring(0, 1) + "." + players[i].surname + ")" : "";

                options += "<li><a href='javascript:$.showPlayerList(false, &#39;" + name + "&#39;)'>" + name + wName + "</a></li>";
            }

            playerList.append(options);

            //Refresh View
            playerList.listview('refresh');

            // Run complete function
            completeFunction();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Error
        }
    });
};

/* GAME PLAYERS */
$.showGamePlayerList = function(show, player){

    const formContent = $(".gameForm");
    const gamePlayerList = $("#gamePlayerList");

    if(show){

        formContent.fadeOut(function() {
            gamePlayerList.fadeIn('fast');
        });

        return;

    }

    gamePlayerList.fadeOut(function() {
        formContent.fadeIn('fast');

        if(player != null){

        }
    });

};

/* Get List of game players */
/* TODO: Fix complete */
$.getGamePlayerList = function(completeFunction){

    const gamePlayerList = $("#gamePlayerList ul");

    gamePlayerList.html("");

    const selectedPlayer = $("#selectedPlayerName").val();

    //Get Player List
    $.ajax({
        type: "GET",
        url: "/api/players",
        success: function(json){

            const players = json.players;

            let options = "";

            for (let i = 0; i < players.length; i++) {

                const name = players[i].name;

                // Don't include selected player
                if(selectedPlayer !== name) {

                    options += "<li><label style='display:block;'><input type='checkbox' id='player-" + name + "' name='player-" + name + "'> " + name + "</label></li>";
                }
            }

            gamePlayerList.append(options);

            //Refresh View
            gamePlayerList.listview('refresh');

            // Run complete function
            completeFunction();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Error
        }
    });
};


/* GAMES */
function showGameListUI(){

    $(".gameForm").fadeOut(function() {

        $("#gameList").fadeIn('fast');

    });
};

$.showGameList = function(show, selectedGameId, selectedGameName){

    if(show){

        // Load the game list
        $.getGameList(showGameListUI);

        return;
    }

    $("#gameList").fadeOut(function() {

        $(".gameForm").fadeIn('fast');

        if(selectedGameId != null){

            $.setExistingGameSelected(selectedGameId, selectedGameName);

            // Hide cancel as just selected
            $("#cancel").hide();

            return;
        }

        // Cancel is pressed
        $.showNewGameForm(true);
    });

};


/* Get List of Games */
$.getGameList = function(completeFunction){

    const gameList = $("#gameList ul");

    gameList.html("");

    //Get Player List
    $.ajax({
        type: "GET",
        url: "/api/games?order-by=_id&dir=asc",
        success: function(json){

            const games = json.games;

            let options = "";

            for (let i = 0; i < games.length; i++) {

                const game = games[i];

                const id = game._id;

                const owner = game.owner;

                const name = $.generateGameName(game);

                const cardsLeft = game.cardsLeft;

                const noCards = cardsLeft === 0;

                let html = "href='javascript:$.showGameList(false, &#39;" + id + "&#39;, &#39;" + name + "&#39;)'";

                if(noCards){

                    html = "style='text-decoration: line-through !important;'";
                }

                let playerNames = "<p class='activePlayers'>Players: ";

                $.each(game.players, function(index, player) {

                    if(player.active) {
                        playerNames += player.name + ", "
                    }
                });

                playerNames = playerNames.substring(0, playerNames.length - 2) + "</p>";

                options += "<li><a " + html + " >" + name + playerNames + "</a>";

                if(owner === $("#selectedPlayerName").val() || noCards) {

                    options += "<a href='javascript:$.deleteGame(&#39;" + id + "&#39;)' data-role='button' data-theme='b' data-inline='true' data-icon='minus'></a>";
                }

                options += "</li>";
            }

            gameList.append(options);

            //Refresh View
            gameList.listview('refresh');

            // Run complete function
            completeFunction();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Error
        }
    });
};

$.setExistingGameSelected = function(selectedGameId, selectedGameName){

    // Don't show new game form
    $.showNewGameForm(false);

    // Selected a game
    GAME_ID = selectedGameId;

    const gameName = $("#gameName");

    gameName.val(selectedGameName);
    gameName.attr("readonly", "readonly");
    gameName.addClass("selected");

    $("#eg").addClass("selected");
    $("#ng").removeClass("selected");

    $("#start").html($("#start").html().replace("Start", "Join"));

};

$.deleteGame = function(id){

    $.ajax({
        type: "DELETE",
        url: "/api/games/" + id,
        dataType: "json",
        success: function(json){

            //Refresh game list
            $.getGameList();

        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {


        }
    });

};