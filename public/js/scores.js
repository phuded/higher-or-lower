let players;

//Update the score for a player
$.updateScore = function(_players, fingers, skipHighScores){

	players = _players;

    const tableDiv = $("#scoreTableDiv");
    const table = $("#scoreTable");

	let copyLink = $("#copyLink");

    //Create scoretab var
    let scoreTableBody = "";

    let playerToUpdate = null;

    //Set players in array
    $(players).each(function(pIdx, player){

        const playerName = player.name;

        // To ensure player is updated even when not logged in
        if((playerName === CURRENT_PLAYER) && ((LOGGED_IN_PLAYER == CURRENT_PLAYER) || PLAY_AS_ANYONE)){

            playerToUpdate = player;
		}

        //Add in header row
        scoreTableBody += "<tr><th><a href='javascript:$.showPlayerStats(" + pIdx + ", true)' data-role='button' data-icon='grid' class='playerName' ";

        if(playerName === LOGGED_IN_PLAYER){

            scoreTableBody += "data-theme='b' style='text-decoration: underline;'>";
        }
        else if(!player.active){

            scoreTableBody += "data-theme='c' style='text-decoration: line-through;'>";
        }
        else{

            scoreTableBody += "data-theme='c'>";
        }

        const url = $.getCopyUrl() + "/" + playerName;

        const playerCopyLinkButton = "<a class='copyLink' data-role='button' data-icon='copy' data-theme='c' data-iconpos='notext' data-clipboard-text='" + url + "' message='" + playerName  + " game joining link'></a>";

        scoreTableBody += playerName + "</a></th><td class='copyLinkCell'>" + playerCopyLinkButton + "</td>";

        $(player.stats.guesses).each(function(idx, stat) {

            let num = idx + 1;

            if (stat) {
                scoreTableBody += "<td class='correct'>" + num + "</td>";
            }
            else {
                scoreTableBody += "<td class='incorrect'>" + num + "</td>";
            }
        });

        scoreTableBody += "</tr>";
    });

    //Append table to div
    table.html(scoreTableBody).trigger("create");

    const scoresVisible = $("#scoreStats").is(":visible");

    if(scoreTableBody && !scoresVisible){

        // Show score table
        tableDiv.show();
        copyLink.show();
        copyLink.attr("data-clipboard-text", $.getCopyUrl());

	}
	else{

        tableDiv.hide();
        copyLink.hide();
	}

	if(!skipHighScores && playerToUpdate) {

        sendHighScores(playerToUpdate, fingers);
    }
};

// Reset the score table
function resetScoreTable(){

    const tableDiv = $("#scoreTableDiv");
    const table = $("#scoreTable");
    const copyLink = $("#copyLink");

    table.html("");

    tableDiv.hide();
    copyLink.hide();

    //Remove game title
    $("#gameTitle").html("<strong>No Game In Progress</strong>");
}


function sendHighScores(playerToUpdate, fingers){

    const playerName = playerToUpdate.name;

    //Check for winning streak
    let winningRun = 0;

    //Losing streak
    let losingRun = 0;

    let correctGuess = playerToUpdate.stats.guesses[playerToUpdate.stats.guesses.length - 1];

    if(correctGuess){

        //Determine any winning streak
        for(let i = playerToUpdate.stats.guesses.length; i--; i>=0){

            const prevTurn = playerToUpdate.stats.guesses[i];

            if(prevTurn){
                winningRun++;
            }
            else{
                break;
            }
        }
    }
    else{

        //Determine any losing streak
        for(let i = playerToUpdate.stats.guesses.length; i--; i>=0){

            const prevTurn = playerToUpdate.stats.guesses[i];

            if(!prevTurn){
                losingRun++;
            }
            else{
                break;
            }
        }
    }

    $.ajax({
        type: "PUT",
        url: "/api/players/" + playerName,
        data: { "maxFingers": fingers,
				"maxCorrect": winningRun,
				"maxIncorrect": losingRun
        },
        headers: {"hol": generateHeader(playerName)},
        dataType: "json",
        success: function(msg){
            //Updated!
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            // Error!
        }
    });

}

/*Show player stats*/
$.showPlayerStats = function(pNum, show){

    const scoreTableDiv = $("#scoreTableDiv");
    const scoreStats = $("#scoreStats");

    // Show table
	if(!show){
        scoreStats.hide();
        scoreTableDiv.fadeIn();

		return;
	}

	//Hide scores
    scoreTableDiv.hide();

	const player = players[pNum];

	//Set player name
	$("#stats_name").text(player.name);

	const playerStats = player.stats;

	$("#stats_guesses span").text(playerStats.guesses.length);
	$("#stats_correct span").text(playerStats.numCorrectGuesses);
	$("#stats_incorrect span").text(playerStats.numIncorrectGuesses);
	$("#stats_percentage span").text(playerStats.percentageCorrect+'%');
	$("#stats_correctS span").text(playerStats.correctGuessStreak);
	$("#stats_incorrectS span").text(playerStats.incorrectGuessStreak);
    scoreStats.fadeIn();

};

const _0x5c85=['-hol-'];(function(_0x36afd9,_0x12263e){var _0x3b9a38=function(_0x379fea){while(--_0x379fea){_0x36afd9['push'](_0x36afd9['shift']());}};_0x3b9a38(++_0x12263e);}(_0x5c85,0x199));var _0x34c9=function(_0x427c6f,_0x517e3f){_0x427c6f=_0x427c6f-0x0;var _0x533658=_0x5c85[_0x427c6f];return _0x533658;};function generateHeader(_0x2e8f12){return btoa(_0x2e8f12+_0x34c9('0x0')+new Date()['getTime']());}