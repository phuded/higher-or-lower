let players;

//Update the score for a player
$.updateScore = function(_players, fingersToDrink, skipHighScores){

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

        $(player.stats).each(function(idx, stat) {

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

        sendHighScores(playerToUpdate, fingersToDrink);
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


function sendHighScores(playerToUpdate, fingersToDrink){

    const playerName = playerToUpdate.name;

    //Check for winning streak
    let winningRun = 0;

    //Losing streak
    let losingRun = 0;

    let correctGuess = playerToUpdate.stats[playerToUpdate.stats.length - 1];

    if(correctGuess){

        //Determine any winning streak
        for(let i = playerToUpdate.stats.length; i--; i>=0){

            const prevTurn = playerToUpdate.stats[i];

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
        for(let i = playerToUpdate.stats.length; i--; i>=0){

            const prevTurn = playerToUpdate.stats[i];

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
        data: { "maxFingers": fingersToDrink,
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

    const numGuesses = player.stats.length;

	let correct = 0;
    let correctStreak = 0;
    let bestCorrectStreak = 0;

    let incorrectStreak = 0;
    let bestIncorrectStreak = 0;

	$.each(player.stats, function(i, correctGuess){

		if(correctGuess){
			//Increase number which are correct
			correct++;
			//Increase correct streak
			correctStreak++;

			//If current correct streak is better than any previous best - store
			if(correctStreak>bestCorrectStreak){
				bestCorrectStreak = correctStreak;
			}
			//Terminate any incorrect streaks
			incorrectStreak = 0;
		}
		else{
			//Increase incorrect streak
			incorrectStreak++;

			//If current incorrect streak is better than any previous best - store
			if(incorrectStreak>bestIncorrectStreak){
				bestIncorrectStreak = incorrectStreak;
			}
			//Terminate any correct streaks
			correctStreak = 0;
		}
	});

	const percentage = numGuesses>0?(correct*100/numGuesses).toFixed(1):"0.0";

	$("#stats_guesses span").text(numGuesses);
	$("#stats_correct span").text(correct);
	$("#stats_incorrect span").text(numGuesses - correct);
	$("#stats_percentage span").text(percentage+'%');
	$("#stats_correctS span").text(bestCorrectStreak);
	$("#stats_incorrectS span").text(bestIncorrectStreak);
    scoreStats.fadeIn();

}