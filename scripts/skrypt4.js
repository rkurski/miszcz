/*
1925 - piguła max normal
1926 - piguła max rare
1927 - piguła max unique
1928 - piguła max elite
1929 - piguła max super unique

1930 - piguła przyrost normal
1931 - piguła przyrost rare
1932 - piguła przyrost unique
1933 - piguła przyrost elite
1934 - piguła przyrost super unique

1936 - sfera normal
1937 - sfera rare
1938 - sfera unique

1243 - czerwone senzu
1784 - karta dusz
1935 - tytuł 
1941 - KK
*/

const desiredItems = [
    1784, 1941, 1934, 1929, 1933, 1928, 1932, 1927, 1931, 1926, 1930,
    1925, 1243,
  ];
  
  const getTraderItems = (callback) => {
    let itemsToBuy = [];
  
    $('button[data-option="buy_from_trader2"]').each(function () {
      let itemIndex = parseInt($(this).attr('data-item')),
        itemId = parseInt($(this).attr('data-itemid')),
        itemAmount = parseInt($(this).attr('data-itemam'));
  
      if (desiredItems.includes(itemId)) {
        itemsToBuy.push({
          index: itemIndex,
          item: itemId,
          amount: itemAmount,
        });
      }
    });
  
    callback(itemsToBuy);
  };
  
  const buyTraderItems = (itemsToBuy) => {
    if (itemsToBuy.length > 0) {
      itemsToBuy.sort(function (item1, item2) {
        return desiredItems.indexOf(item1.item) - desiredItems.indexOf(item2.item);
      });
  
      GAME.socket.emit('ga', {
        a: 51,
        type: 3,
        item: itemsToBuy[0].index,
        iid: itemsToBuy[0].item,
        amount: itemsToBuy[0].amount,
      });
  
      setTimeout(() => {
        getTraderItems((updatedItems) => {
          buyTraderItems(updatedItems);
        });
      }, 100);
    } else {
      if (!$('#trader_goods2 .trade_good').length) {
        GAME.socket.emit('ga', {
          a: 51,
          type: 0,
        });
  
        setTimeout(() => {
          getTraderItems((newItems) => {
            buyTraderItems(newItems);
          });
        }, 100);
      } else {
        if ($('#trader_goods2 .trade_good').length && !itemsToBuy.length) {
          console.log('Brak itemów w sklepie');
        }
      }
    }
  };
  
  getTraderItems((items) => {
    buyTraderItems(items);
  });