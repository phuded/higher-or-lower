let players;

$.getCopyUrl = function(){

    let url = window.location.href.split("/");
    url.pop();
    url.pop();
    url = url.join("/");

    copyTextToClipboard(url);
}

//TODO: make util class
function copyTextToClipboard(text) {

    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {

        document.execCommand('copy');

    } catch (err) {

    }

    document.body.removeChild(textArea);
}

//Update the score for a player
$.updateScore = function(_players, fingersToDrink, skipHighScores){

	players = _players;

    let table = $("#scoreTable");

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
        scoreTableBody += "<tr><th><a href='javascript:$.showPlayerStats(" + pIdx + ", true)' data-role='button' data-icon='grid' ";

        if(playerName === LOGGED_IN_PLAYER){

            scoreTableBody += "data-theme='b' style='text-decoration: underline;'>" + playerName + "</a></th>";
        }
        else if(!player.active){

            scoreTableBody += "data-theme='c' style='text-decoration: line-through;'>" + playerName + "</a></th>";
        }
        else{

            scoreTableBody += "data-theme='c'>" + playerName + "</a></th>";
        }

        var numStats = player.stats.length;

        $(player.stats).slice(-8).each(function(idx, stat) {

            var num = idx + 1;

        	if(numStats > 8 ){

                num += (numStats - 8);

            }

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
        table.show();
        copyLink.show();

	}
	else{

	    table.hide();
        copyLink.hide();
	}

	if(!skipHighScores && playerToUpdate) {

        sendHighScores(playerToUpdate, fingersToDrink);
    }
};

// Reset the score table
function resetScoreTable(){

    var table = $("#scoreTable");

    table.html("");

    table.hide();
}


function sendHighScores(playerToUpdate, fingersToDrink){

    var playerName = playerToUpdate.name;

    //Check for winning streak
    var winningRun = 0;

    //Losing streak
    var losingRun = 0;

    var correctGuess = playerToUpdate.stats[playerToUpdate.stats.length - 1];

    if(correctGuess){

        //Determine any winning streak
        for(var i = playerToUpdate.stats.length; i--; i>=0){

            var prevTurn = playerToUpdate.stats[i];

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
        for(i = playerToUpdate.stats.length; i--; i>=0){

            var prevTurn = playerToUpdate.stats[i];

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

    // Show table
	if(!show){
		$("#scoreStats").hide();
		$("#scoreTable").fadeIn();

		return;
	}

	//Hide scores
	$("#scoreTable").hide();

	var player = players[pNum];

	//Set player name
	$("#stats_name").text(player.name);

	var numGuesses = player.stats.length;

	var correct = 0;
	var correctStreak = 0;
	var bestCorrectStreak = 0;

	var incorrectStreak = 0;
	var bestIncorrectStreak = 0;

	$.each(player.stats ,function(i, correctGuess){
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

	var percentage = numGuesses>0?(correct*100/numGuesses).toFixed(1):"0.0";

	$("#stats_guesses span").text(numGuesses);
	$("#stats_correct span").text(correct);
	$("#stats_incorrect span").text(numGuesses - correct);
	$("#stats_percentage span").text(percentage+'%');
	$("#stats_correctS span").text(bestCorrectStreak);
	$("#stats_incorrectS span").text(bestIncorrectStreak);
	$("#scoreStats").fadeIn();

}