var players;

//Update the score for a player
$.updateScore = function(_players){

	players = _players;

	var table = $(".scoreTable");

    //Create scoretab var
    var scoreTableBody = "";

    //Set players in array
    $(players).each(function(pIdx, player){

        const playerName = player.name;

        //Add in header row
        scoreTableBody += "<tr><th><a href='javascript:$.showPlayerStats(" + pIdx + ", true)' data-role='button' data-icon='grid' data-theme='"+((pIdx%2 == 0)?"c":"b")+"'>" + playerName + "</a></th>";

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


    // Reset scoretab
	$(".scoreTable").show();
};


/*Show player stats*/
$.showPlayerStats = function(pNum, show){

	if(!show){
		$("#scoreStats").hide();
		$(".scoreTable").fadeIn();

		return;
	}

	//Hide scores
	$(".scoreTable").hide();

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