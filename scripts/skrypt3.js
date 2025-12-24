const karty = () => {
    const cards = $(`#ekw_page_items div[data-base_item_id="1784"]`);
    const limit = 200; // ILE KART MA ZOSTAWIĆ
    const cards_to_open = 100; // ILE KART MA OTWORZYĆ JEDNOCZEŚNIE
  
    if (cards.length && (parseInt(cards.attr("data-stack")) - cards_to_open) > limit) {
        const cards_id = parseInt(cards.attr("data-item_id"));
        const cards_stack = parseInt(cards.attr("data-stack"))
        const amount = cards_stack > cards_to_open ? 100 : cards_stack;
  
        GAME.socket.emit('ga',{a: 12, type: 14, iid: cards_id, page: GAME.ekw_page, page2: GAME.ekw_page2, am: amount});
  
        setTimeout(() => { karty(); },  200);
    } else {
        GAME.komunikat("Nie masz więcej kart");
    }
  }
  
  karty();