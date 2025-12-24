// BOT = {
//     chars:[],
//     timeout:1000,
// }

// GAME.emitOrder = (data) => GAME.socket.emit('ga',data);

// BOT.Start = function(){
//     if(this.chars.length > 0){
//         setTimeout(function(){ BOT.LogIn(); },this.timeout);
//     }else{
//         GAME.komunikat("Koniec ustawiania treningu!");
//     }
// }

// BOT.LogIn = function(){
//     char_id = parseInt(this.chars);
//     GAME.emitOrder({a:2,char_id:char_id});

//     setTimeout(function(){ BOT.ustawTreny(); },this.timeout);
// }

// BOT.ustawTreny = function() {
//     var statystykaPierwsza = 3 //1 sila, 2 szybkosc itd tak jak masz w rozwijanym tym gównie na stronie
//     var czasPierwszego = 12 //od 1 do 12, chyba ze bonusów nie masz to do 6 wiadomo

//     var statystykaDruga = 3
//     var czasDrugiego = 12

//     var mistrzPierwszego = 0 //0 to brak, 1, genialny zolw, itd 4 - 1KP pamietaj
//     var mistrzDrugiego = 0

//     var czyPodwojnieUlepszycTrening = 0 //0 - ulepszy trening pojedynczo, 1 - ulepszy trening podwojnie

//     BOT.ustawTrening(statystykaPierwsza, czasPierwszego, mistrzPierwszego);
//     BOT.ustawTrening(statystykaDruga, czasDrugiego, mistrzDrugiego);
//     setTimeout(function() { BOT.ulepszTrening(czyPodwojnieUlepszycTrening); }, this.timeout);
// }

// BOT.ustawTrening = function(stat, czas, mistrz) {
//     GAME.emitOrder({a:8,type:2,stat:stat,duration:czas,master:mistrz});
// }

// BOT.ulepszTrening = function(double) {
//     var czyPodwojny = true == double;
//     GAME.emitOrder({ a: 8, type: 5, doublec: false, multi: false, code: undefined, apud: 'vzaaa' });
//     this.chars.shift();
//     setTimeout(function(){ BOT.Start(); },this.timeout);
// }

// BOT.GetChars = function(){
//     for(i=0; i<GAME.player_chars; i++){
//         char = $("li[data-option=select_char]").eq(i);
//         BOT.chars.push(char.attr("data-char_id"));
//     }
    
//     BOT.Start();
// }();