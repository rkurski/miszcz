function upgrade_item() {
    var iid = parseInt(GAME.dragged_item.sel.data('item_id'));
    var max = GAME.dragged_item.stack;
    var kom;
    if (parseInt(GAME.dragged_item.sel.data('class')) == 12) {
        kom = '<div>' + LNG.lab40 + '<br /><img src="' + GAME.dragged_item.img + '" /><div class="game_input small"><input id="upg_am" type="text" value="1" /></div><button class="set_max btn_small_gold" data-target="#upg_am" data-max="' + max + '">MAX</button><br />Na jaki +<div class="game_input small"><input id="super_desired_lvl" type="text" value="1"></div></br>Ile subek<div class="game_input small"><input id="super_subs" type="text" value="1"></div><br /><button class="option btn_small_gold" onclick="upgrading(' + GAME.dragged_item.sel.data('base_item_id') + ')">osa :)</button></div></br>' + LNG.lab36 + ': <b id="upg_succes_chance">??</b>%<br />' + LNG.lab41 + ': <b id="upg_sub_left"></b><br /><button class="option btn_small_gold" data-option="upg2_item">OK</button></div>';
    } else {
        kom = '<div>' + LNG.lab40 + '<br /><img src="' + GAME.dragged_item.img + '" /><div class="game_input small"><input id="upg_am" type="text" value="1" /></div><button class="set_max btn_small_gold" data-target="#upg_am" data-max="' + max + '">MAX</button><br /><br />' + LNG.lab36 + ': <b id="upg_succes_chance">??</b>%<br />' + LNG.lab41 + ': <b id="upg_sub_left"></b><br /><button class="option btn_small_gold" data-option="upg2_item">OK</button></div>';
    }
    GAME.komunikat(kom);
    setmaxBind();
    option_bind();
    GAME.socket.emit('ga',{ a: 122, type: 9, iid: iid });
  }
  
  function upgrading(item_id, level, subs) {
    var level = parseInt($("#super_desired_lvl").val());
    var subs = parseInt($("#super_subs").val());
    var inter = setInterval(
        function () {
            var $el = $("[data-base_item_id=" + item_id + "]");
            var el_id = $el.data('item_id');
            if (GAME.dragged_item.upgrade < level & subs > 0) {
                GAME.socket.emit('ga',{ a: 12, type: 10, iid: el_id, page: GAME.ekw_page, am: parseInt($('#upg_am').val()) });
                subs--;
            } else {
                clearInterval(inter)
            }
        }, 200)
  }
  