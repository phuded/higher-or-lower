
$.prepareGame = function(){

	//Get player list
	$.getPlayerList();
	
	$('#drink').live('pageshow',function(event){
		var fingers = $("#numFingers");
		fingers.animate({fontSize:'3.0em'}, 400);
		fingers.animate({fontSize:'1.0em'}, 300);
		
	});
	
	//When the drinkers tab is selected
	$('#drinkers').live('pageshow',function(event){
		$("#drinkersTab table").removeData("sort");
		$.generateDrinkersTab(2,"max_finger","desc");
	});
	
	//When the scores tab is unselected - reset the stats deep view
	$('#scores').live('pagehide',function(event){
		$.showPlayerStats(0,false);
	});

	//Show cancel button when form closes for future
	$('#form').live('pagehide',function(event){
		$("#cancel").show();
	});	
	
	//Show loading on drinkers tab close
	$('#game, #scores').live('pageshow',function(event){
		$.showLoading(true);
	});	

};


$.startGame = function(){
	
	var canPlay = true;
		
	//Check to ensure all player names are entered
	$("#playerRows tr").each(function(){
		if($(this).children("td:eq(0)").children("input").val() == ""){
			canPlay = false;
		}
	});
		
	if(canPlay){
		//Reset player
		currentPlayer = 0;
		
		//Reset bet
		currentBet=0;
		//Set drink type
		$("input.drinkOption").each(function(){
			if($(this).attr("checked")){
				drinkType = $(this).val()
			}
		});
		//Reset bet counter
		$("#totalNumFingers").text(currentBet + " " + drinkType + "s");
		
		players = new Array();
		playersScores = new Array();
		//Restore all cards based on toggle
		$.resetPack();

		//Reset scoretab
		$(".scoreTable").html("");
		
		//Show loading
		if(!$("#cancel").is(":visible")){
			$(".game_spinner").show();
		}
		
		//Create scoretab var
		var scoreTable = "";
		
		//Set players in array
		$("#playerRows tr").each(function(){
			var playerName = $(this).find("input").val();
			players.push(playerName);
			playersScores.push(new Array());
			//Add in header row
			scoreTable += "<tr><th><a href='javascript:$.showPlayerStats("+(players.length-1)+",true)' data-role='button' data-icon='grid' data-theme='"+((players.length%2 == 0)?"c":"b")+"'>"+playerName+"</a></th></tr>";
		});
	
		//Append table to div
		$(".scoreTable").append(scoreTable).trigger("create");
	
		//Display Player
		$("#playerName").html("<strong>"+players[currentPlayer] + "</strong> guess Higher or Lower!");
		
		//New card
		currentCard = cards[Math.floor(Math.random()*cards.length)];
		
		//Hide any current card
		$("#cardDisplay").removeClass('green red');
		
		//Preload images & close dialogue
		$.preLoadImages(preloadImages,function() {
			//Hide loading
			$(".game_spinner").hide();
			$.closeForm();
			//Display card
			$.displayCard(currentCard);
			//Reset bet slider
			$("#currentNumFingers").val(0).slider("refresh");
		});
	}
};

$.playTurn = function(higherGuess){
	if(players.length>0){
		//Remove colour from background
		$("#cardDisplay").removeClass('green red');
		//Add just made bet to total bet
		currentBet += parseInt($("#currentNumFingers").val());

		//Reset bet counter
		$("#currentNumFingers").val(0).slider("refresh");
		
		//Get new card 
		var nextCard = cards[Math.floor(Math.random()*cards.length)];
		var correctGuess = (higherGuess & $.compareCards(nextCard,currentCard)) || (!higherGuess & $.compareCards(currentCard,nextCard)); 
		
		//Display card
		$.displayCard(nextCard,correctGuess);
		
		//Finally make the current card the next one
		currentCard=nextCard;
	}
};



//Display the card
$.displayCard = function(card,correctGuess){
	//Card number
	var cardNum = parseInt(card.substring(1));
	//Card image
	var cardImg = $("#card");
	//Bet before reset
	var cBet = currentBet;
	
	//Not first card -flipping
	if(correctGuess !== undefined){
		//Hide slider if bet on any card is off
		if(!$("#fullBetting").attr('checked')){
			$("#sliderBar").hide();
		}
		//Rotate card and display new one
		cardImg.rotate3Di(
			360,
			1000,
			{
				sideChange: function(front) {
					if (front) {
						//Replace image
						$(this).css('background','url(images/allcards.png) no-repeat '+$.getCardCoords(card));			
					} else {
						//Make back of card the pack;
						$(this).css('background','url(images/allcards.png) no-repeat 0px -580px');	
					}
				},
				complete:function(){
				
					if(correctGuess){
						//Green background
						$("#cardDisplay").addClass('green');
					}
					else{
						//Red background
						$("#cardDisplay").addClass('red');
					
						//Show Lee
						if(currentBet > 0){
							$("#drinkMessage").html("<b>"+players[currentPlayer] + "</b> you must drink...<br/><span id='numFingers'>"+(currentBet>1?currentBet + " " + drinkType + "s!":currentBet + " " + drinkType + "!")+"</span>");
						}
						else{
							$("#drinkMessage").html("<b>"+players[currentPlayer] + "</b> you must drink...<br/>&nbsp;");
						}
						//Reset bet since all fingers drank!
						currentBet =0;
						//Show Lee
						setTimeout('$.openDialog()',150);
					}
					
					//Check if can display betting buttons
					if((cardNum>5 & cardNum<11) || $("#fullBetting").attr('checked')){
						$("#sliderBar").show();
					}
						
					//Update scores
					$.updateTurnScores(correctGuess,cBet);
					
					//Set the next player and change text
					$.setNextPlayer();
				}
			}
		);
	}
	else{
		//Showing card for first time
		cardImg.css('background',"url(images/allcards.png) no-repeat "+$.getCardCoords(card));		
		cardImg.show();
		
		//Check if can display betting buttons
		if((cardNum>5 & cardNum<11) || $("#fullBetting").attr('checked')){
			$("#sliderBar").show();
		}
		else{
			$("#sliderBar").hide();
		}
	}
	
	//Remove card if remove cards is enabled
	if($("#removeCards").attr('checked')){
		cards.remove(cards.indexOf(card));
		if(cards.length == 0){
			//If no cards left - reset pack
			$.resetPack();
		}
	}
	
	//Update num of cards left
	$("#cardsLeft").html((((cards.length==13 & !$("#wholePack").attr('checked')) || cards.length==52)?"<u>"+cards.length+"</u>":cards.length) + " " +(cards.length>1?"cards":"card"));
};

//Update DB, scores and current number of fingers
$.updateTurnScores = function(correctGuess,cBet){

	var oldPlayerName = players[currentPlayer];
	
	//Check for winning streak
	var winningRun = 0;
	
	if(correctGuess){
		//Add 1 for turn just won
		winningRun = 1;
		//Determine any winning streak
		for(var i = playersScores[currentPlayer].length; i--; i>=0){
			var prevTurn = playersScores[currentPlayer][i];
			if(prevTurn){
				winningRun++;
			}
			else{
				break;
			}
		}
	}
	
	$.ajax({
		type: "POST",
		url: "editPlayer.php",
		data: "name="+oldPlayerName+"&maxFingers="+(correctGuess?0:cBet)+"&maxCorrect="+winningRun,
		dataType: "json",
		success: function(msg){							
			//Updated!
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			// Error!
		}
	});
	
	//Update fingers	
	$("#totalNumFingers").text(currentBet + " " + ((currentBet>1 || currentBet==0)?drinkType +"s":drinkType));
	
	//Update the score on score tab
	$.updateScore(correctGuess, currentPlayer);
};


//Get the next player from the array
$.setNextPlayer = function(){
	if((currentPlayer+1) == players.length){
		currentPlayer = 0;
	}
	else{
		currentPlayer++;
	}
	//change text
	$("#playerName").html("<strong>"+players[currentPlayer] + "</strong> guess Higher or Lower!");
};


//Reset the pack
$.resetPack = function(){
	if($("#wholePack").attr('checked')){
		cards = new Array();
		for(var i =2;i<15;i++){
			cards.push("h"+i);
			cards.push("d"+i);
			cards.push("c"+i);
			cards.push("s"+i);
		}
	}
	else{
		cards = new Array();
		for(var i =2;i<15;i++){
			cards.push("h"+i);

		}
	}
};

$.compareCards = function(next,current){
	//Returns true if card 1 >= card 2
	return (parseInt(next.substring(1)) >= parseInt(current.substring(1)));
};


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

//Return card coords 
$.getCardCoords = function(card){
	var cardSuit = card.substring(0,1);
	var y;
	
	if(cardSuit == 'c'){
		y = "0px"
	}
	else if (cardSuit == 'd'){
		y = "-145px"
	}
	else if (cardSuit == 'h'){
		y = "-290px"
	}
	else{
		y = "-435px"
	}
	var x = (parseInt(card.substring(1)) - 2) * -100;

	return x + "px " + y;
};
 

$.preLoadImages = function(imageList,callback) {
		var pic = [], i, total, loaded = 0;
		if (typeof imageList != 'undefined') {
			if ($.isArray(imageList)) {
				total = imageList.length; // used later
					for (i=0; i < total; i++) {
						pic[i] = new Image();
						pic[i].onload = function() {
							loaded++; // should never hit a race condition due to JS's non-threaded nature
							if (loaded == total) {
								if ($.isFunction(callback)) {
									callback();
								}
							}
						};
						pic[i].src = imageList[i];
					}
			}
			else {
				pic[0] = new Image();
				pic[0].onload = function() {
					if ($.isFunction(callback)) {
						callback();
					}
				}
				pic[0].src = imageList;
			}
		}
		pic = undefined;
};


//Game variables
var players = new Array();
var playersScores = new Array();

var currentCard;
var currentPlayer = 0;
var currentBet = 0; 

var cards = new Array();

//Number of drinkers displayed in table
var maxDrinkerRows = 10;
//Drink type
var drinkType;
//Images to preload
var preloadImages =['images/allcards.png','images/correct.jpg','images/incorrect.jpg'];
