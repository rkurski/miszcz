/**
 * Gieniobot Master - Constants
 * Centralized constants for the extension
 */

// Version
const VERSION = '2.0.0';

// Socket action codes
const SOCKET_ACTIONS = {
  CHAR_SELECT: 2,
  MAP: 3,
  MAP_MOVE: 4,
  TELEPORT: 6,
  FIGHT: 7,
  TRAINING: 8,
  KNOWLEDGE: 9,
  EXPEDITION: 10,
  ITEM: 12,
  ATTACK_MOB: 13,
  BLESS: 14,
  MISC: 15,
  TRANSFORM: 18,
  TELEPORT_LIST: 19,
  QUEST: 22,
  PVP: 24,
  DAILY_REWARD: 26,
  RIDDLES: 29,
  STATS: 33,
  CLAN: 39,
  TITLES: 42,
  PET: 43,
  INSTANCES: 44,
  BALL: 45,
  ARENA: 46,
  ACTIVITY: 49,
  EMPIRE: 50,
  VIP: 54,
  TOURNAMENT: 57,
  CARDS: 58,
  ABYSS: 59,
  EQUIPMENT_SET: 64,
  CHAT: 600
};

// Race transformations mapping
const RACE_TRANSFORMATIONS = {
  0: [ // Saiyan
    [19, 'ssj1'], [25, 'ssj2'], [26, 'ssj3'], [30, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  1: [ // Half-Saiyan
    [46, 'ssj1'], [50, 'ssj2'], [53, 'ssj3'], [55, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  2: [ // Namekian
    [63, 'ssj1'], [64, 'ssj2'], [66, 'ssjm'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  3: [ // Frieza Race
    [78, 'ssj1'], [76, 'ssj2'], [79, 'ssj3'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  4: [ // Android
    [92, 'ssj1'], [93, 'ssj2'], [99, 'ssj3'], [100, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  5: [ // Majin
    [101, 'ssj1'], [102, 'ssj2'], [103, 'ssj3'], [110, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  6: [ // Shinjin
    [121, 'ssj1'], [122, 'ssj2'], [123, 'ssj3'], [124, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ],
  7: [ // Gohan
    [127, 'ssj1'], [128, 'ssj2'], [129, 'ssj3'], [132, 'ssj4'],
    [39, 'ssj5'], [72, 'ssja'], [81, 'ssjb'], [116, 'ssj_uio']
  ]
};

// Daily quests names (for marking in quest tracker)
const DAILY_QUESTS = [
  'zadanie pvm', 'zadanie pvp', 'rozwój planety', 'zadanie imperium',
  'zadanie klanowe', 'najlepszy kucha...', 'reputacja', 'symbol wymiarów',
  'wymiana chi', 'ermita', 'nuda', 'dostawca', 'boska moc', 'rozgrzewka',
  'boski ulepszacz', 'czas podróżnikó...', 'strażnik porząd...',
  'codzienny insty...', 'hiper scalacz', 'dziwny medyk'
];

// Ball bonus types
const BALL_BONUSES = [
  { id: 13, bonus: '% do obrażeń' },
  { id: 14, bonus: '% do redukcji obrażeń' },
  { id: 15, bonus: '% do efektywności treningu' },
  { id: 16, bonus: '% do doświadczenia' },
  { id: 17, bonus: '% do szansy na trafienie krytyczne' },
  { id: 18, bonus: '% do redukcji szansy na otrzymanie trafienia krytycznego' },
  { id: 51, bonus: '% do obrażeń od technik' },
  { id: 52, bonus: '% redukcji obrażeń od technik' },
  { id: 53, bonus: '% do szansy na moc z walk PvM' },
  { id: 54, bonus: '% do ilości mocy z walk PvM' },
  { id: 55, bonus: '% do szansy na zdobycie przedmiotu z walk PvM' },
  { id: 56, bonus: 'minut(a) krótsze wyprawy' },
  { id: 57, bonus: '% do szansy powodzenia wypraw' },
  { id: 58, bonus: '% do szansy na ulepszenie przedmiotów' },
  { id: 59, bonus: '% do szansy na połączenie przedmiotów' },
  { id: 60, bonus: '% do obrażeń od trafień krytycznych' },
  { id: 61, bonus: '% redukcji obrażeń od trafień krytycznych' },
  { id: 62, bonus: '% do mocy za wygrane walki wojenne' },
  { id: 63, bonus: '% do skuteczności podpaleń' },
  { id: 64, bonus: '% do skuteczności krwawień' },
  { id: 65, bonus: '% do odporności na podpalenia' },
  { id: 66, bonus: '% do odporności na krwawienia' },
  { id: 67, bonus: '% do szansy na zdobycie PSK' },
  { id: 68, bonus: '% do punktów PvP za wygrane walki' },
  { id: 69, bonus: '% do szansy na 3x więcej punktów PvP za wygrane walki' },
  { id: 70, bonus: '% do szansy na 3x więcej doświadczenia za wygrane walki PvM' },
  { id: 71, bonus: '% do mocy za skompletowanie SK' },
  { id: 72, bonus: '% do mocy za skompletowanie PSK' },
  { id: 73, bonus: 'minut(y) do czasu trwania błogosławieństw' },
  { id: 74, bonus: '% do szansy na spotkanie legendarnych potworów' },
  { id: 75, bonus: 'minut(y) krótszy cooldown między walkami PvP' },
  { id: 76, bonus: '% zwiększenie własnej szybkości' },
  { id: 77, bonus: '% obniżenie szybkości przeciwnika' },
  { id: 78, bonus: '% do szansy na zdobycie Niebieskiego Senzu' },
  { id: 79, bonus: '% mniejsze obrażenia od podpaleń' },
  { id: 80, bonus: '% mniejsze obrażenia od krwawień' },
  { id: 81, bonus: '% do szansy na zdobycie Scoutera' },
  { id: 91, bonus: '% do wtajemniczenia' },
  { id: 99, bonus: '% większy limit dzienny Niebieskich Senzu' },
  { id: 139, bonus: '% do ilości zdobywanych kryształów instancji' },
  { id: 140, bonus: '% do przyrostu Punktów Akcji' },
  { id: 154, bonus: '% do sławy za walki w wojnach imperiów' },
  { id: 160, bonus: '% do boskiego atrybutu przewodniego' },
  { id: 163, bonus: '% więcej Boskiej Ki za CSK' },
  { id: 171, bonus: '% do max Punktów Akcji' }
];

// Activity thresholds
const ACTIVITY_THRESHOLDS = [25, 50, 75, 100, 150];

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  QUEST_PROCEED: ['x', 'X'],
  PVP_KILL: ['b', 'B'],
  USE_COMPRESSOR: ['n', 'N'],
  SENZU: '2',
  SFERA: '3',
  BLESS: '4',
  VIP: '5',
  RENT: '6',
  EXPEDITION: '7',
  EQUIPMENT_SET: '8',
  ALT_PILOT: '=',
  PREV_CHAR: ',',
  NEXT_CHAR: '.'
};

// Map movement directions
const MAP_DIRECTIONS = {
  UP: 2,
  DOWN: 1,
  LEFT: 8,
  RIGHT: 7,
  UP_LEFT: 6,
  UP_RIGHT: 5,
  DOWN_LEFT: 4,
  DOWN_RIGHT: 3
};
