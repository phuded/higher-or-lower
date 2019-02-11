// TODO: create player on fly? make all players lowercase and enforce lowercase
$.getCopyUrl = function(){

    let url = window.location.href.split("/");
    url.pop();
    url.pop();
    url = url.join("/");

    return url;
};

$.generateGameName = function(game, bold){

    let gameName = game.name;

    if(bold){

        gameName = "<strong>" + gameName + "</strong>";
    }

    return gameName + " [Created by: " + game.owner + "]";
};

$.handleInvalidParams = function () {

    // Get game player list
    $.getGamePlayerList();

    // History
    history.replaceState({}, "", "/");

    // Show the page
    $("body").show();
};


$.preLoadImages = function(imageList, callback) {

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

function playAsAnyoneChecked(){

    const playAsAnyone = $("#playAsAnyone").attr('checked');

    if(playAsAnyone === "checked"){

        return true;
    }

    return false;
};
function removeCardChecked(){

    const remove = $("#removeCards").attr('checked');

    if(remove === "checked"){

        return true;
    }

    return false;
};

function useWholePackChecked(){

    const wholePack = $("#wholePack").attr('checked');

    if(wholePack === "checked"){

        return true;
    }

    return false;
};

function betAnyCardChecked(){

    const fullBetting = $("#fullBetting").attr('checked');

    if(fullBetting === "checked"){

        return true;
    }

    return false;
};