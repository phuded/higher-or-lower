
/* Get List of players */
$.getPlayerList = function(){

    $("div#playerList ul").html("");

    //Get Player List
    $.ajax({
        type: "GET",
        url: "api/players",
        success: function(json){

            const players = json.players;

            var options = '';

            for (var i = 0; i < players.length; i++) {

                const name = players[i].name;

                const wName = players[i].fname ?" (" + players[i].fname.substring(0, 1) + "." + players[i].surname + ")" : "";

                options += "<li><a href='javascript:$.showPlayerList(false, &#39;" + name + "&#39;)'>" + name + wName + "</a></li>";
            }

            $("div#playerList ul").append(options);

            //Refresh View
            $('#playerList ul').listview('refresh');
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Error
        }
    });
};

/* Get List of players */
$.getGameList = function(){

    const gameList = $("#gameList ul");

    gameList.html("");

    //Get Player List
    $.ajax({
        type: "GET",
        url: "api/games?order-by=_id&dir=asc",
        success: function(json){

            const games = json.games;

            var options = '';

            for (var i = 0; i < games.length; i++) {

                const game = games[i];

                const id = game._id;

                const owner = game.owner;

                const name = game.name + " [Created by: " + owner + "]";

                const cardsLeft = game.cardsLeft;

                const noCards = cardsLeft === 0;

                let html = "href='javascript:$.showGameList(false, &#39;" + id + "&#39;, &#39;" + name + "&#39;)'";

                if(noCards){

                    html = "style='text-decoration: line-through !important;'";
                }

                let playerNames = "<p class='activePlayers'>Players: ";

                $.each(game.players, function( index, player ) {

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
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //Error
        }
    });
};

/*TRANSITIONS*/

//Show form panels - list 
$.showPlayerList = function(show, player){

    var formContent = $(".gameForm");
    var playerList = $("#playerList");

    if(show){
        formContent.fadeOut(function() {
            playerList.fadeIn('fast');
        });

    }
    else{
        playerList.fadeOut(function() {
            formContent.fadeIn('fast');

            if(player != null){

                $("#selectedPlayerName").val(player);

                // Store in cookie
                $.setCookie(player);

                $("#errorMessage").hide();

            }
        });
    }
};

$.setCookie = function(playerName){

    const date = new Date();
    date.setTime(date.getTime() + (1 * 86400000));

    const expires = "expires=" + date.toUTCString();

    document.cookie = "user=" + playerName + ";" + expires + ";path=/";
}

$.deleteGame = function(id){

    $.ajax({
        type: "DELETE",
        url: "api/games/" + id,
        dataType: "json",
        success: function(json){

            //Refresh game list
            $.getGameList();

            // Deleting current game
            if(GAME_ID && GAME_ID === id){

                $.clearCurrentGame();
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {


        }
    });

}


//Show form panels - create new player
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
    }

    //Call method to create player and display main form if 2nd argument true
    var pName = $("#pname");

    //Get username
    var playerName = pName.val();

    const playerNameValid = (playerName.length > 0) && (playerName.indexOf("Player ") == -1);

    if(!playerNameValid){

        //Invalid in use - clear name and show warning
        pName.val("");
        errorMessage.show();

        return
    }

    var fName = $("#fname").val();
    var surname = $("#surname").val();

    //Add new player
    $.ajax({
        type: "POST",
        url: "api/players",
        data: {	name: playerName,
                firstName: fName,
                surname: surname
        },
        dataType: "json",
        success: function(json){

            //Added!
            //Refresh player list
            $.getPlayerList();

            //Show previous screen
            playerForm.fadeOut(function() {

                formContent.fadeIn('fast');

                $("#selectedPlayerName").val(playerName);

                $.clearNewPlayerForm();

                // Remove main form error
                $("#errorMessage").hide();
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


$.showGameList = function(show, selectedGameId, selectedGameName){

    var formContent = $(".gameForm");
    var gameList = $("#gameList");

    if(show){

        // Load the game list
        $.getGameList();

        formContent.fadeOut(function() {
            gameList.fadeIn('fast');
        });

        return;
    }

    gameList.fadeOut(function() {

        formContent.fadeIn('fast');

        if(selectedGameId != null){

            GAME_ID = selectedGameId;

            $("#selectedGameName").val(selectedGameName);

            $("#start").html($("#start").html().replace("Create New", "Join"));

        }
    });

};


$.clearCurrentGame = function(){

   // Hide cancel
   $("#cancel").hide();

   GAME_ID = null;

   $.clearGameSelection();
}

$.clearGameSelection = function(){

    $("#selectedGameName").val("");

    $("#start").html($("#start").html().replace("Join", "Create New"));
}