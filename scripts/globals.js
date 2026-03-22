// ============================================
// GLOBAL VARIABLES
// ============================================

let grammar = {};
let augmentedGrammar = {};
let firstSets = {};
let followSets = {};
let lr0States = [];
let parserMode = 'SLR';
let parserStates = [];
let stateTransitions = {};
let actionTable = {};
let gotoTable = {};
let conflicts = [];
let resolvedConflicts = [];
let parseTree = null;
let algorithmComparison = {};
let nonTerminals = new Set();
let terminals = new Set();
let startSymbol = '';
let precedence = {}; // { operator: { level: number, assoc: 'left'|'right'|'none' } }
let productionPrecedence = []; // Precedence for each production written
