// ============================================
// MAIN - EVENT LISTENERS AND ANALYSIS
// ============================================

// Event Listeners
document.getElementById('analyzeBtn').addEventListener('click', analyzeGrammar);
document.getElementById('clearBtn').addEventListener('click', clearAll);
document.getElementById('exampleBtn').addEventListener('click', loadExample);
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'parseBtn') {
        parseInputString();
    }
});

function setLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (!loader) return;

    if (show) {
        loader.classList.add('show');
    } else {
        loader.classList.remove('show');
    }
}

function renderTabShells() {
    const statesTab = document.getElementById('states');
    const dfaTab = document.getElementById('dfa');
    const tableTab = document.getElementById('table');
    const stepsTab = document.getElementById('steps');
    const treeTab = document.getElementById('tree');
    const conflictsTab = document.getElementById('conflicts');

    if (statesTab) {
        statesTab.innerHTML = `
            <div id="augmentedGrammar" class="result-content"></div>
            <div id="firstSets" class="result-content"></div>
            <div id="followSets" class="result-content"></div>
            <div id="lr0States" class="result-content"></div>
        `;
    }

    if (dfaTab) {
        dfaTab.innerHTML = '<div id="transitions" class="result-content"></div>';
    }

    if (tableTab) {
        tableTab.innerHTML = `
            <div id="actionTable" class="result-content table-container"></div>
            <div id="gotoTable" class="result-content table-container"></div>
            <div id="algorithmComparison" class="result-content table-container"></div>
        `;
    }

    if (stepsTab) {
        stepsTab.innerHTML = `
            <div class="parse-input-section">
                <input type="text" id="parseInput" placeholder="Enter input to parse (e.g., id + id * id)">
                <button id="parseBtn" class="btn-primary">Parse Input</button>
            </div>
            <div id="parseResult" class="result-content"></div>
        `;
    }

    if (treeTab) {
        treeTab.innerHTML = '<div id="parseTree" class="result-content"></div>';
    }

    if (conflictsTab) {
        conflictsTab.innerHTML = '<div id="conflictDetails" class="result-content conflict-content"></div>';
    }
}

function clearTabContents() {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.innerHTML = '';
    });
}

function setStatusBar(message, type = 'info') {
    const bar = document.getElementById('statusBar');
    if (!bar) return;

    bar.className = `status-bar ${type}`;
    bar.textContent = message;
}

function setActiveTabButton(tabId) {
    const buttons = document.querySelectorAll('.tab-btn');

    buttons.forEach(button => {
        const handler = button.getAttribute('onclick') || '';
        if (handler.includes(`'${tabId}'`)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    setActiveTabButton(id);
}

// Utility Functions
function clearAll() {
    document.getElementById('grammarInput').value = '';
    document.getElementById('precedenceInput').value = '';
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('errorMessage').textContent = '';
    
    // Reset global variables
    grammar = {};
    augmentedGrammar = {};
    firstSets = {};
    followSets = {};
    lr0States = [];
    parserMode = 'SLR';
    parserStates = [];
    stateTransitions = {};
    actionTable = {};
    gotoTable = {};
    conflicts = [];
    resolvedConflicts = [];
    parseTree = null;
    algorithmComparison = {};
    nonTerminals.clear();
    terminals.clear();
    startSymbol = '';
    precedence = {};
    productionPrecedence = [];

    document.getElementById('parserType').value = 'SLR';
    clearTabContents();
    renderTabShells();
    setLoading(false);
    showTab('states');
    setStatusBar('Workspace reset. Add grammar and click Analyze Grammar.', 'info');
}

function loadExample() {
    const exampleGrammar = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`;
    
    const examplePrecedence = `+ 1 left
* 2 left`;
    
    const exampleInput = `id + id * id`;
    
    document.getElementById('grammarInput').value = exampleGrammar;
    document.getElementById('precedenceInput').value = examplePrecedence;
    document.getElementById('parserType').value = 'SLR';

    const parseInputEl = document.getElementById('parseInput');
    if (parseInputEl) {
        parseInputEl.value = exampleInput;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setStatusBar('Error while analyzing grammar.', 'error');
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
}

// Main Analysis Function
function analyzeGrammar() {
    try {
        hideError();
        setLoading(true);
        clearTabContents();
        renderTabShells();
        showTab('states');
        setStatusBar('Analyzing grammar...', 'info');
        
        const input = document.getElementById('grammarInput').value.trim();
        const precInput = document.getElementById('precedenceInput').value.trim();
        parserMode = document.getElementById('parserType').value;
        
        if (!input) {
            showError('Please enter a grammar');
            return;
        }
        
        // Reset
        nonTerminals.clear();
        terminals.clear();
        parseTree = null;
        
        // 1. Parse precedence
        precedence = parsePrecedence(precInput);
        
        // 2. Parse grammar
        grammar = parseGrammar(input);
        
        // 3. Augment grammar
        augmentedGrammar = augmentGrammar(grammar);
        
        // 4. Compute production precedence
        productionPrecedence = computeProductionPrecedence();
        
        // 5. Compute FIRST sets
        firstSets = computeFirstSets();
        
        // 6. Compute FOLLOW sets
        followSets = computeFollowSets();
        
        // 7. Build item sets for selected mode
        const itemSetResult = buildItemSetsForMode(parserMode);
        parserStates = itemSetResult.states;
        stateTransitions = itemSetResult.transitions;
        lr0States = parserStates;
        
        // 8. Build parsing table
        const tableResult = buildParsingTable(parserMode, parserStates, stateTransitions);
        actionTable = tableResult.action;
        gotoTable = tableResult.goto;
        conflicts = tableResult.conflicts;
        resolvedConflicts = tableResult.resolved;

        // 9. Build cross-algorithm comparison
        algorithmComparison = computeAlgorithmComparison();
        
        // 10. Display results
        displayResults();

        if (conflicts.length > 0) {
            setStatusBar(`Conflict detected: ${conflicts.length} unresolved conflict(s).`, 'warning');
        } else {
            setStatusBar(`Grammar parsed successfully in ${parserMode} mode.`, 'success');
        }
        
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        setLoading(false);
    }
}

function computeAlgorithmComparison() {
    const modes = ['SLR', 'CLR', 'LALR'];
    const comparison = {};

    for (let mode of modes) {
        const itemSetResult = buildItemSetsForMode(mode);
        const tableResult = buildParsingTable(mode, itemSetResult.states, itemSetResult.transitions);

        let actionEntries = 0;
        let gotoEntries = 0;

        for (let state in tableResult.action) {
            actionEntries += Object.keys(tableResult.action[state]).length;
        }

        for (let state in tableResult.goto) {
            gotoEntries += Object.keys(tableResult.goto[state]).length;
        }

        const totalTableEntries = actionEntries + gotoEntries;
        const memoryScore = itemSetResult.states.length + totalTableEntries;

        comparison[mode] = {
            states: itemSetResult.states.length,
            actionEntries,
            gotoEntries,
            tableSize: totalTableEntries,
            conflicts: tableResult.conflicts.length,
            resolved: tableResult.resolved.length,
            memoryScore,
            status: tableResult.conflicts.length === 0 ? 'Works' : 'Conflicts'
        };
    }

    return comparison;
}

// Initialization
renderTabShells();
showTab('states');
setStatusBar('Ready. Add grammar and click Analyze Grammar.', 'info');
console.log('LR Parser Simulator (SLR/CLR/LALR) loaded successfully!');
