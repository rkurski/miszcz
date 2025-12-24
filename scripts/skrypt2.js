var glebia_helper_caseNumber = 0;
var glebia_helper_wait = 5;
var glebia_helper_glebia_helper_waitpvp = 200;
var glebia_helper_licznik = 0;
var glebia_helper_STOP = true;
var glebia_helper_dogory = false;
var glebia_helper_loc;

var glebia_helper_move1 = false;
var glebia_helper_move2 = false;
var glebia_helper_move3 = false;

const $css = "#glebia_helper {min-width:100px; padding:5px; border:solid gray 1px; background:rgba(22, 22, 93, 0.81); color:gold; position: fixed; top: 40px; right: 5px; z-index:5;}#glebia_helper .glebia_button {cursor:pointer;text-align:center; border-bottom:solid gray 1px;}";
const $html = "<div class='glebia_button glebia_pvp'>GŁĘBIA <b class='glebia_status red'>Off</b></div>";
$('body').append("<div id='glebia_helper'>" + $html + "</div>").append("<style>" + $css + "</style>");

$('#glebia_helper .glebia_pvp').click(() => {
	if (glebia_helper_STOP) {
		$('#glebia_helper .glebia_pvp')
		$(".glebia_pvp .glebia_status").removeClass("red").addClass("green").html("On");
		glebia_helper_STOP = false
		start()
	} else {
		$('#glebia_helper .glebia_pvp')
		$(".glebia_pvp .glebia_status").removeClass("green").addClass("red").html("Off");
		glebia_helper_STOP = true
	}
});

function start() {
    if (glebia_helper_STOP === false) {
        if (!GAME.is_loading && !glebia_helper_STOP) {
            if (!GAME.is_loading) {
                if (!GAME.is_loading && !glebia_helper_STOP) {
                    action();
                }
            } else {
                window.setTimeout(start, glebia_helper_wait);
            }
        } else {
            window.setTimeout(start, glebia_helper_wait);
        }
    }

    function action() {
        const functions = [
            check_position_x,
            check_position_y,
            check_players,
            check_players2,
            kill_players,
            check_glebia_helper_location,
            go
        ];

        functions[glebia_helper_caseNumber]();
        glebia_helper_caseNumber = (glebia_helper_caseNumber + 1) % functions.length;
    }
}

function go() {
    var x = GAME.char_data.x;
    var y = GAME.char_data.y;

    if (x == 11 && y == 11 && glebia_helper_dogory && glebia_helper_loc == 1) {
        cofanie2();
    } else if (x == 15 && y == 15 && glebia_helper_move3 && glebia_helper_loc == 2) {
        cofanie();
    } else if (x == 2 && y == 11 && glebia_helper_loc == 1 && glebia_helper_move1) {
        przejdz();
        window.setTimeout(move(7), 1000);
    } else if (x == 1 && y == 1 && glebia_helper_loc == 2 && glebia_helper_move3) {
        przejdz();
        window.setTimeout(move(7), 1000);
    } else if (x == 7 && y == 7 && glebia_helper_loc == 2 && glebia_helper_move2 || x == 9 && y == 7 && glebia_helper_loc == 2 && glebia_helper_move2) {
        move(3);

    } else if (x == 8 && y == 8 && glebia_helper_loc == 2 && glebia_helper_move2 || x == 10 && y == 8 && glebia_helper_loc == 2 && glebia_helper_move2) {
        move(5);
    } else if (x == 10 && y == 11 && glebia_helper_loc == 1) {
        glebia_helper_dogory = true;
        move(7);
    } else if (x == 10 && y == 2 && glebia_helper_loc == 1) {
        glebia_helper_dogory = false;
        move(8);
    } else if (x == 5 && y == 10 && glebia_helper_loc == 1) {
        glebia_helper_move1 = true;
        move(8);
    } else if (x == 10 && y == 10 && glebia_helper_loc == 1) {
        glebia_helper_move1 = true;
        move(8);
    } else if (x == 3 && y == 1 && glebia_helper_loc == 2) {
        glebia_helper_move1 = false;
        move(7);
    } else if (x == 3 && y == 10 && glebia_helper_loc == 1) {
        move(4);
    } else if (x == 2 && y == 8 && glebia_helper_loc == 1) {
        move(3)
    } else if (x == 11 && y == 11 && glebia_helper_loc == 1 || x == 15 && y == 15 && glebia_helper_loc == 2) {
        move(2);
    } else if (x == 5 && y == 7 && glebia_helper_loc == 2) {
        glebia_helper_move2 = true;
        move(7);
    } else if (x == 13 && y == 7 && glebia_helper_loc == 2) {
        glebia_helper_move2 = false;
        move(7);
    } else if (x == 12 && y == 15 && glebia_helper_loc == 2) {
        glebia_helper_move3 = true;
        move(7);
    } else if (x == 5 && y == 11 && glebia_helper_loc == 1) {
        glebia_helper_move3 = false;
        move(7);
    } else if (x == 10 && y == 15 && glebia_helper_loc == 2) {
        glebia_helper_move3 = true;
        move(7);
    } else if (x == 7 && y == 11 && glebia_helper_loc == 1) {
        glebia_helper_move3 = false;
        move(7);
    } else if (x == 7 && y == 7 && glebia_helper_loc == 2) {
        move(1);
    } else if (x < 11 && y % 2 !== 0 && glebia_helper_loc == 1 || x < 15 && y % 2 !== 0 && glebia_helper_loc == 2) {
        move(7);
    } else if (x > 2 && y % 2 == 0 && glebia_helper_loc == 1 || x > 1 && y % 2 == 0 && glebia_helper_loc == 2) {
        move(8);
    } else if (x == 11 && glebia_helper_loc == 1 || x == 2 && glebia_helper_loc == 1 || x == 3 && y == 9 && glebia_helper_loc == 1 || x == 1 && glebia_helper_loc == 2 || x == 15 && glebia_helper_loc == 2 || x == 7 && y == 7 && glebia_helper_loc == 2) {
        move(1);

    }
}

function cofanie() {
    y = GAME.char_data.y
    if (y <= 1) {
        window.setTimeout(start, glebia_helper_wait);
    } else {
        GAME.emitOrder({
            a: 4,
            dir: 6,
            vo: GAME.map_options.vo
        });
        window.setTimeout(cofanie, 50);
    }
}

function cofanie2() {
    y = GAME.char_data.y
    if (y <= 2) {
        window.setTimeout(start, glebia_helper_wait);
    } else {
        GAME.emitOrder({
            a: 4,
            dir: 2,
            vo: GAME.map_options.vo
        });
        glebia_helper_move1 = true;
        window.setTimeout(cofanie2, 50);
    }
}

function move(direction) {
    const direct = [2, 1, 8, 7, 5, 4, 3];

    if (direct.includes(direction)) {
        GAME.emitOrder({
            a: 4,
            dir: direction,
            vo: GAME.map_options.vo
        });
        window.setTimeout(start, glebia_helper_wait);
    }
}

function check_position_x() {
    x = GAME.char_data.x
    window.setTimeout(start, glebia_helper_wait);
}

function check_position_y() {
    y = GAME.char_data.y
    window.setTimeout(start, glebia_helper_wait);
}

function check_players() {

    if (0 < document.getElementById("player_list_con").childElementCount) {
        y = GAME.char_data.y
        tabb = document.getElementById("player_list_con").children[0].children[1].children[0].textContent.split(":");
        if (document.getElementById("player_list_con").children[0].children[1].childElementCount == 3) {
            tabb = document.getElementById("player_list_con").children[0].children[1].children[0].textContent.split(":");
            if (parseInt(tabb[1]) <= 1 && y == 2) {
                window.setTimeout(check_players, 1500);
            } else {
                window.setTimeout(start, glebia_helper_wait);
            }
        } else {
            window.setTimeout(start, glebia_helper_wait);
        }
    } else {
        window.setTimeout(start, glebia_helper_wait);
    }

}

function check_players2() {
    if (0 < document.getElementById("player_list_con").childElementCount) {
        tabb = document.getElementById("player_list_con").children[0].children[1].children[0].textContent.split(":");
        if (parseInt(tabb[2]) <= 30 && parseInt(tabb[1]) <= 0) {
            window.setTimeout(check_players2, 1500);
        } else {
            window.setTimeout(start, glebia_helper_glebia_helper_waitpvp)
        }
    } else {
        window.setTimeout(start, glebia_helper_glebia_helper_waitpvp)
    }
}

function kill_players() {
    if ($("#player_list_con").find("[data-option=load_more_players]").length == 1) {
        $("#player_list_con").find("[data-option=load_more_players]").click();
        window.setTimeout(kill_players, 150);
    } else if (glebia_helper_licznik < document.getElementById("player_list_con").childElementCount) {
        if (document.getElementById("player_list_con").children[glebia_helper_licznik].children[1].children[0].attributes[1].value === "gpvp_attack" || document.getElementById("player_list_con").children[glebia_helper_licznik].children[1].children[1].attributes[1].value === "gpvp_attack") {
            GAME.emitOrder({
                a: 24,
                type: 1,
                char_id: document.getElementById("player_list_con").children[glebia_helper_licznik].children[0].children[1].attributes[2].value,
                quick: 1
            });
            glebia_helper_licznik++;
            window.setTimeout(kill_players, glebia_helper_glebia_helper_waitpvp);
        } else {
            GAME.emitOrder({
                a: 24,
                char_id: document.getElementById("player_list_con").children[glebia_helper_licznik].children[1].children[1].attributes[2].value,
                quick: 1
            });
            glebia_helper_licznik++;
            window.setTimeout(kill_players, glebia_helper_glebia_helper_waitpvp);

        }
    } else {
        window.setTimeout(start, glebia_helper_wait);
        glebia_helper_licznik = 0;
        kom_clear();
    }
}

function przejdz() {
    GAME.emitOrder({
        a: 6,
        tpid: 0
    });
    window.setTimeout(glebia_helper_STOP, 1000);
    glebia_helper_move3 = false;
    glebia_helper_move1 = false;
}

function check_glebia_helper_location() {
    const glebia_helper_locationMap = {
        "Głębia": 1,
        "Głębia Rajskiej Sali": 2
    };

    const glebia_helper_locationName = GAME.current_loc.name
    glebia_helper_loc = glebia_helper_locationMap[glebia_helper_locationName] || 7;
    window.setTimeout(start, glebia_helper_wait);
}

start();