# Instrukcje dla Claude

## Język
- Komunikuj się po polsku
- Komentarze w kodzie: po angielsku, nazwy mechanik gry po polsku

## Projekt
Chrome Extension (MV3) automatyzująca grę kosmiczni.pl. Vanilla JS, brak npm/buildu/testów/TypeScript. Reload rozszerzenia = update.

## Kluczowe pliki
- `content_script.js` - extension context, CSP bridge (CustomEvent) do chrome.storage
- `content_script1.js` - loader, kolejność ładowania skryptów ma znaczenie
- `remote/core/gieniobot.js` - główna klasa bota, handlery w `handlers/` to mixiny
- `remote/afo/` - moduły automatyzacji (singletony na `window.*`)
- `remote/afo/dailyQuests.js` - ~5300 linii, czytaj selektywnie
- `remote/reconnect/` - auto-reconnect, aktywny development

## Globalne obiekty (window.*)
- `GAME` - API gry (.socket, .char_data, metody)
- `AFO_PVP`/`PVP`, `AFO_RESP`/`RESP`, `AFO_LPVM`/`LPVM`, `AFO_DAILY`/`DAILY`, `AFO_GLEBIA`/`GLEBIA`, `AFO_RES`/`RES`, `AFO_CODE`/`CODE` - aliasy, obie nazwy używane zamiennie
- `AFO_STATE_MANAGER`, `AFO_STORAGE`, `AFO_RECONNECT`, `AFO_CREDENTIALS`

## Wzorzec modułu AFO
```javascript
const AFO_<MODUL> = { enabled: true, init() {}, start() {}, stop() {} };
```

## bigcode.html - reverse-engineering klienta gry

### Jak szukać mechanik w bigcode.html
Plik jest duży (~20k linii zminifikowanego JS). Strategia:
1. **Znajdź request** — szukaj `socket.emit` lub obfuskowanej funkcji emit (`obd2c34e82aed5b5f6c3db249446b9295`) z kodem akcji `{a:XX}`
2. **Znajdź handler odpowiedzi** — szukaj `case XX:` w głównym switch obsługi `'gr'` (socket response). Stamtąd trafiasz do `GAME.parseData(YY, res)` — numer YY to case w parseData
3. **Znajdź rendering** — szukaj `case YY:` w `parseData`. Tam widzisz jakie pola ma `res` i jak budowany jest HTML
4. **Znajdź page_switch** — szukaj `case 'nazwa_strony':` żeby zobaczyć jaki request (`a:XX`) odpowiada danej zakładce w UI

### Jak pobierać dane bez zmiany strony
Request socketowy (np. `{a:51, type:0}`) wysyła dane i aktualizuje DOM docelowego diva — ale **NIE przełącza strony**. `page_switch()` to osobna funkcja wywoływana przez handler kliknięcia. Więc można:
1. Wysłać `GAME.socket.emit('ga', {a:XX, ...})` w dowolnym momencie
2. Hookować `parseData(YY)` żeby przechwycić odpowiedź
3. DOM zaktualizuje się w tle (jeśli strona docelowa nie jest widoczna — użytkownik nic nie zauważy)

### Hookowanie parseData
Wzorzec chainowania (np. traderAutoBuy.js:658, exchangeHighlight.js):
```javascript
const origPD = GAME.parseData.bind(GAME);
GAME.parseData = function(type, res) { origPD(type, res); /* twój kod */ };
```
Kolejność hooków = kolejność ładowania w SCRIPTS (content_script1.js).

## Pułapki
- `content_script.js` = extension context, `remote/*.js` = page context - nie mieszaj API
- `chrome.storage` niedostępne w page context - używaj bridge (CustomEvent w content_script.js)
- `GAME.socket` może nie istnieć od razu (dynamiczne przechwytywanie)

## Częste operacje
- Nowy moduł AFO: plik w `remote/afo/` + dodaj do `loader.js` + stan w `state.js`
- Nowy handler Gieniobot: mixin w `remote/core/handlers/` + dodaj do `content_script1.js`
- Nowy feature (niezależny IIFE): plik w `remote/features/` + dodaj do SCRIPTS w `content_script1.js` (wzorzec: traderAutoBuy.js, exchangeHighlight.js)
- Zapis stanu: `AFO_STATE_MANAGER` + `AFO_STORAGE`
- Komunikacja z grą: `GAME.socket.emit()` lub nadpisanie w `game-overrides.js`
- Hook na dane gry: `GAME.parseData` chainowanie (patrz sekcja bigcode.html)
- Pasywne nasłuchiwanie: `GAME.socket.on('gr', (res) => { if(res.a === X) ... })`
