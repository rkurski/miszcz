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

## Pułapki
- `content_script.js` = extension context, `remote/*.js` = page context - nie mieszaj API
- `chrome.storage` niedostępne w page context - używaj bridge (CustomEvent w content_script.js)
- `GAME.socket` może nie istnieć od razu (dynamiczne przechwytywanie)

## Częste operacje
- Nowy moduł AFO: plik w `remote/afo/` + dodaj do `loader.js` + stan w `state.js`
- Nowy handler Gieniobot: mixin w `remote/core/handlers/` + dodaj do `content_script1.js`
- Zapis stanu: `AFO_STATE_MANAGER` + `AFO_STORAGE`
- Komunikacja z grą: `GAME.socket.emit()` lub nadpisanie w `game-overrides.js`
