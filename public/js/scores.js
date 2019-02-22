let players;

//Update the score for a player
$.updateScore = function(_players){

    const tableDiv = $("#scoreTableDiv");
    const table = $("#scoreTable");

	let copyLink = $("#copyLink");

    //Create scoretab var
    let scoreTableBody = "";

    players = _players.sort(function(p1, p2){return p1.rank - p2.rank});

    //Set players in array
    $(players).each(function(pIdx, player){

        const playerName = player.name;

        let icon = "grid";

        if(pIdx === 0){
            icon = "star"
        }

        //Add in header row
        scoreTableBody += "<tr><td style='font-size: 12px;'>" + (pIdx + 1) + ".</td><th><a href='javascript:$.showPlayerStats(" + pIdx + ", true)' data-role='button' class='playerName' ";

        if(playerName === LOGGED_IN_PLAYER){

            scoreTableBody += "data-icon='" + icon + "' data-theme='b' style='text-decoration: underline;'>";
        }
        else if(!player.active){

            scoreTableBody += "data-icon='" + icon + "' data-theme='c' style='text-decoration: line-through;'>";
        }
        else{

            scoreTableBody += "data-icon='" + icon + "' data-theme='c'>";
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

        return;

	}

    tableDiv.hide();
    copyLink.hide();

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

    $("#stats_fingers span:first-child").text(DRINK_TYPE + "s");
    $("#stats_fingers span:nth-child(2)").text(playerStats.fingersDrank);

    scoreStats.fadeIn();

};