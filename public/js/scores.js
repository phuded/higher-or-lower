//Update the score for a player
$.updateScore = function(correct, oldPlayer){
	//Add score to array and score tab
	playersScores[oldPlayer].push(correct);
	
	//Get the row object for the old player
	var playerScoreRow = $("#scoreTab table tr:eq("+oldPlayer+")");

	$.addScoreCol(playerScoreRow,correct,oldPlayer);
};

//Add a new column to the score tab
$.addScoreCol = function(playerScoreRow,correct, playerId){
	//If table is full - delete first row before adding latest
	
	var numCols = 6;
	
	if(playerScoreRow.children("td").size() == numCols){
		playerScoreRow.find("td:eq(0)").remove();
	}
	if(correct){
		playerScoreRow.append("<td class='correct'>" + playersScores[playerId].length)
	}
	else{
		playerScoreRow.append("<td class='incorrect'>" + playersScores[playerId].length)
	}
};

/*Show player stats*/
$.showPlayerStats = function(pNum,show){
	if(show){
		//Hide scores
		$(".scoreTable").hide();
		//Set player name
		$("#stats_name").text(players[pNum]);
		
		var numGuesses = playersScores[pNum].length;
		
		var correct = 0;
		var correctStreak = 0;
		var bestCorrectStreak = 0;
		
		var incorrectStreak = 0;
		var bestIncorrectStreak = 0;

		$.each(playersScores[pNum],function(i,v){
			if(v){
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
	else{
		$("#scoreStats").hide();
		$(".scoreTable").fadeIn();
	}	
}