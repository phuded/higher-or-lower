let sortedPlayers;

//Update the score for a player
$.updateScore = function(currentPlayerName, players, gameOver){

    const tableDiv = $("#scoreTableDiv");
    const table = $("#scoreTable");

	let copyLink = $("#copyLink");

    //Create scoretab var
    let scoreTableBody = "";

    sortedPlayers = players.sort(function(p1, p2){return p1.rank - p2.rank});

    const copyUrls = [];

    //Set players in array
    $(sortedPlayers).each(function(pIdx, player){

        const playerName = player.name;

        const url = $.getCopyUrl() + "/" + playerName;

        let icon = "grid";

        if(!gameOver && (playerName === currentPlayerName)){
            icon = "man";
        }

        if(gameOver && (pIdx === 0)){
            icon = "crown";
        }

        let rowStart = "<tr>";

        if(!player.active){
            rowStart = "<tr style='opacity: 0.6;'>";
        }

        //Add in header row
        scoreTableBody += rowStart + "<td style='font-size: 12px;'>" + (pIdx + 1) + ".</td><th><a href='javascript:$.showPlayerStats(" + pIdx + ", true)' data-role='button' class='playerName' ";

        if(playerName === LOGGED_IN_PLAYER){

            scoreTableBody += "data-icon='" + icon + "' data-theme='b' style='text-decoration: underline;'>";
        }
        else{

            scoreTableBody += "data-icon='" + icon + "' data-theme='c'>";

            copyUrls.push(playerName + ": " + url);
        }

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
        copyLink.attr("data-clipboard-text", copyUrls.join("\n"));

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

	const player = sortedPlayers[pNum];

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