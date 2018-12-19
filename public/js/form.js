
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

                const wName = players[i].fname ?" ("+players[i].fname.substring(0, 1) + "." + players[i].surname + ")" : "";

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

    $("div#gameList ul").html("");

    //Get Player List
    $.ajax({
        type: "GET",
        url: "api/games",
        success: function(json){

            const games = json.games;

            var options = '';

            for (var i = 0; i < games.length; i++) {

                const id = games[i]._id;

                const name = games[i].name;

                options += "<li><a href='javascript:$.showGameList(false, &#39;" + id + "&#39;, &#39;" + name + "&#39;)'>" + name + "</a></li>";
            }

            $("div#gameList ul").append(options);

            //Refresh View
            $('#gameList ul').listview('refresh');
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

            }
        });
    }
};

//Show form panels - create new player

$.createNewPlayer = function(show, player){
	var formContent = $(".gameForm");
	var playerForm = $("#playerForm");
	
	if(show){
		formContent.fadeOut(function() {
			playerForm.fadeIn('fast');
		 });
	}
	else{
		//Clear warning
		playerForm.find("p").hide();
		
		//Call method to create player and display main form if 2nd argument true
		if(player){
			//Get username
			var playerName = $("#pname").val();
			
			if((playerName.length > 0) && (playerName.indexOf("Player ") == -1)){

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

							$("#playerName").val(playerName);

							$.clearNewPlayerForm();
						});
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {

						// Error!
                        //Already in use - clear name and show warning
                        $("#pname").val("");
                        playerForm.find("p").show();

                        return;
					}
				});
			}
			else{
				//Invalid in use - clear name and show warning
				$("#pname").val("");
				playerForm.find("p").show();
			}
		}
		else{
			//Cancel and show main form
			playerForm.fadeOut(function() {
				formContent.fadeIn('fast');
				//Clear form
				$.clearNewPlayerForm();
			});
		}
	}
};

/*Clear new player form */

$.clearNewPlayerForm = function(){
	$(".playerFormField").val("");
};


$.showGameList = function(show, selectedGameId, selectedGameName){

    var formContent = $(".gameForm");
    var gameList = $("#gameList");

    if(show){
        formContent.fadeOut(function() {
            gameList.fadeIn('fast');
        });
    }
    else{
        gameList.fadeOut(function() {
            formContent.fadeIn('fast');

            if(selectedGameId != null){

                gameId = selectedGameId;

                $("#selectedGameId").val(selectedGameName);

            }
        });
    }
};

$.clearGame = function(){

    gameId = null;
    $("#selectedGameId").val("");
}