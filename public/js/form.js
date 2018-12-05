
/* Get List of players */
$.getPlayerList = function(){
	$("div#playerList ul").html("");
	//Get Player List
	$.ajax({
		type: "POST",
		url: "listPlayers.php",
		dataType: "json",
		success: function(json){

			var options = ''; 

			for (var i = 0; i < json.length; i++) {

				var name =json[i].name;
				var wName = json[i].fname ?" ("+json[i].fname.substring(0, 1) + "." + json[i].surname + ")" : "";
				options += "<li><a href='javascript:$.showPlayerList(false, &#39;" + name + "&#39;)'>"+name + wName + "</a></li>";
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

/*TRANSITIONS*/

//Show form panels - list 
$.showPlayerList = function(show, player){
	var formContent = $(".gameForm");
	var playerList = $("#playerList");
	
	if(show){
		formContent.fadeOut(function() {
			playerList.fadeIn('fast');
		 });		

		playerList.data("playerNum", player);
	}
	else{	
		playerList.fadeOut(function() {
			formContent.fadeIn('fast');

			if(player != null){

                var num = playerList.data("playerNum");
                $("tr#player_"+num+" input").val(player);

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

		playerForm.data("playerNum",player);
	}
	else{
		//Clear warning
		playerForm.find("p").hide();
		
		//Call method to create player and display main form if 2nd argument true
		if(player){
			//Get username
			var playerName = $("#pname").val();
			
			if((playerName.length>0) && (playerName.indexOf("Player ") == -1)){
				var fName = $("#fname").val();
				var surname = $("#surname").val();
				
				//Add new player
				$.ajax({
					type: "POST",
					url: "createPlayer.php",
					data: "name="+playerName+"&fname="+fName+"&surname="+surname,
					dataType: "json",
					success: function(json){
						if(json.success){
							//Added!
							//Refresh player list
							$.getPlayerList();
							//Show previous screen
							playerForm.fadeOut(function() {
								formContent.fadeIn('fast');
								var num = playerForm.data("playerNum");
								$("tr#player_"+num+" input").val(playerName);
								$.clearNewPlayerForm();
							});
						}
						else{
							//Already in use - clear name and show warning
							$("#pname").val("");
							playerForm.find("p").show();
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						// Error!
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

/*Add or remove rows on form */

$.addPlayerRow = function(){

	var numPlayers = $("#playerRows tr").size();
	var nextPlayer = numPlayers + 1;
	
	if(numPlayers < 6){
		var newPlayerRow = $.createRow(nextPlayer, "Guest "+nextPlayer);
		//Apply styling
		$(newPlayerRow).appendTo("#playerRows").trigger("create");
	}
	
	numPlayers = $("#playerRows tr").size();
	
	if(numPlayers > 1){
		$("#playerRows tr:eq(0) td:eq(3) a").show();
	}
};
		
$.delPlayerRow = function(rowNum){	
	var lastNum = $("#playerRows tr").size();
	//If there is more than one player
	if(lastNum>1){
		if(rowNum){
			$("#playerRows #player_"+rowNum).remove();
			//Loop through all other players
			for (var i = rowNum+1;i<=lastNum;i++){
				var row = $("#playerRows #player_"+i);
				var name = row.find('input').val();

				if(name == "Player "+i){
					name = "Player "+(i-1);
				}
				row.remove();

				$($.createRow(i-1,name)).appendTo("#playerRows").trigger("create");
			}
		}
		else{
			$("#playerRows #player_"+lastNum).remove();
		}
	}
	
	lastNum = $("#playerRows tr").size();
	if(lastNum == 1){
		$("#playerRows tr:eq(0) td:eq(3) a").hide();
	}
};

$.createRow = function (playerNumber,name){

	var newPlayerRow = "<tr id='player_"+playerNumber+"'><td><input type='text' value='"+name+"' MAXLENGTH=8/></td>";
		
	newPlayerRow += "<td class='icon'><a id='add_"+playerNumber+"' href='javascript:$.createNewPlayer(true," + playerNumber + ")' data-role='button' data-icon='plus'>New</a></td>";
	newPlayerRow += "<td class='icon'><a id='search_"+playerNumber+"' href='javascript:$.showPlayerList(true, " + playerNumber + ")' data-role='button' data-icon='search'>Choose</a></td>";
	newPlayerRow += "<td class='icon-del'><a id='del_"+playerNumber+"' href='javascript:$.delPlayerRow(" + playerNumber + ")' data-role='button' data-icon='minus' data-iconpos='notext'>Remove</a></td>";
	
	newPlayerRow += "</tr>"

	return newPlayerRow;
};