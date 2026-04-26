// ============================================
// PARSING SIMULATION
// ============================================

function parseInputString() {
    const parseInputEl = document.getElementById('parseInput');
    const parseInput = parseInputEl ? parseInputEl.value.trim() : '';
    const resultDiv = document.getElementById('parseResult');

    if (typeof showTab === 'function') {
        showTab('steps');
    }
    
    if (!parseInput) {
        resultDiv.innerHTML = '<p style="color: #dc3545;">Please enter an input string to parse</p>';
        if (typeof setStatusBar === 'function') {
            setStatusBar('Input missing. Provide a token sequence to parse.', 'warning');
        }
        return;
    }
    
    if (Object.keys(actionTable).length === 0) {
        resultDiv.innerHTML = '<p style="color: #dc3545;">Please analyze a grammar first</p>';
        if (typeof setStatusBar === 'function') {
            setStatusBar('Analyze grammar before running parse simulation.', 'warning');
        }
        return;
    }
    
    try {
        const tokens = tokenize(parseInput);
        tokens.push('$'); // Add end marker
        
        const simulation = simulateParsing(tokens);
        const steps = simulation.steps;
        parseTree = simulation.parseTree;
        lastParsingRun = buildParsingRunSnapshot(parseInput, tokens, steps);
        displayParsingSteps(steps);
        displayParseTree();

        const finalAction = steps.length > 0 ? steps[steps.length - 1].action : '';
        if (typeof setStatusBar === 'function') {
            if (finalAction === 'ACCEPT') {
                setStatusBar('Parsing completed successfully.', 'success');
            } else {
                setStatusBar('Parsing completed with rejection/error.', 'warning');
            }
        }
        
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #dc3545;">Error: ${escapeHtml(error.message)}</p>`;
        parseTree = null;
        displayParseTree();

        if (typeof setStatusBar === 'function') {
            setStatusBar('Parsing failed due to runtime error.', 'error');
        }
    }
}

function buildParsingRunSnapshot(parseInput, tokens, steps) {
    const grammarInputEl = document.getElementById('grammarInput');
    const precedenceInputEl = document.getElementById('precedenceInput');
    const parserTypeEl = document.getElementById('parserType');

    return {
        timestamp: new Date().toISOString(),
        parserType: parserTypeEl ? parserTypeEl.value : parserMode,
        grammar: grammarInputEl ? grammarInputEl.value.trim() : '',
        precedence: precedenceInputEl ? precedenceInputEl.value.trim() : '',
        grammarIsValid: isGrammarValidForPersistence(),
        input: parseInput,
        tokens: tokens.slice(),
        itemSets: snapshotItemSets(),
        actionSymbols: getOrderedActionSymbols(),
        gotoSymbols: getOrderedGotoSymbols(),
        actionRows: snapshotActionRows(),
        gotoRows: snapshotGotoRows(),
        steps: steps.map(step => ({
            step: step.step,
            stack: step.stack.slice(),
            symbols: step.symbols.slice(),
            input: step.input,
            action: step.action
        }))
    };
}

function isGrammarValidForPersistence() {
    return (
        parserStates.length > 0 &&
        Object.keys(actionTable).length > 0 &&
        Object.keys(gotoTable).length > 0 &&
        conflicts.length === 0
    );
}

function snapshotItemSets() {
    const itemSets = [];

    for (let i = 0; i < parserStates.length; i++) {
        const state = parserStates[i];
        const formattedItems = [];

        for (let j = 0; j < state.length; j++) {
            const item = state[j];
            const before = item.rhs.slice(0, item.dot).join(' ');
            const after = item.rhs.slice(item.dot).join(' ');
            let text = `${item.lhs} -> ${before} . ${after}`.trim();

            if (item.lookahead) {
                text += `, ${item.lookahead}`;
            }

            formattedItems.push(text);
        }

        itemSets.push({
            state: i,
            items: formattedItems
        });
    }

    return itemSets;
}

function getOrderedActionSymbols() {
    const symbols = Array.from(terminals).sort();
    if (!symbols.includes('$')) {
        symbols.push('$');
    }
    return symbols;
}

function getOrderedGotoSymbols() {
    const augStart = startSymbol + "'";
    return Array.from(nonTerminals)
        .filter(nt => nt !== augStart)
        .sort();
}

function snapshotActionRows() {
    const symbols = getOrderedActionSymbols();
    const rows = [];

    for (let i = 0; i < parserStates.length; i++) {
        const row = { state: i };

        for (let j = 0; j < symbols.length; j++) {
            const symbol = symbols[j];
            row[symbol] = actionTable[i][symbol] || '';
        }

        rows.push(row);
    }

    return rows;
}

function snapshotGotoRows() {
    const symbols = getOrderedGotoSymbols();
    const rows = [];

    for (let i = 0; i < parserStates.length; i++) {
        const row = { state: i };

        for (let j = 0; j < symbols.length; j++) {
            const symbol = symbols[j];
            row[symbol] = gotoTable[i][symbol] !== undefined ? gotoTable[i][symbol] : '';
        }

        rows.push(row);
    }

    return rows;
}

function formatParsingRunAsText(run) {
    const lines = [];

    lines.push('LR Parser Simulation - Full Parsing Steps');
    lines.push('Generated: ' + run.timestamp);
    lines.push('Parser Type: ' + run.parserType);
    lines.push('Input: ' + run.input);
    lines.push('Tokens: ' + run.tokens.join(' '));
    lines.push('Grammar Valid: ' + (run.grammarIsValid ? 'Yes' : 'No'));
    lines.push('');
    lines.push('Grammar:');
    lines.push(run.grammar || '(empty)');

    if (run.precedence) {
        lines.push('');
        lines.push('Precedence Rules:');
        lines.push(run.precedence);
    }

    lines.push('');
    lines.push('Canonical Item Sets:');
    for (let i = 0; i < run.itemSets.length; i++) {
        const itemSet = run.itemSets[i];
        lines.push(`I${itemSet.state}:`);
        for (let j = 0; j < itemSet.items.length; j++) {
            lines.push('  ' + itemSet.items[j]);
        }
    }

    lines.push('');
    lines.push('ACTION Table:');
    lines.push('State | ' + run.actionSymbols.join(' | '));
    lines.push('-----|' + run.actionSymbols.map(() => '---').join('|'));
    for (let i = 0; i < run.actionRows.length; i++) {
        const row = run.actionRows[i];
        const values = run.actionSymbols.map(symbol => row[symbol] || '');
        lines.push(`${row.state} | ${values.join(' | ')}`);
    }

    lines.push('');
    lines.push('GOTO Table:');
    lines.push('State | ' + run.gotoSymbols.join(' | '));
    lines.push('-----|' + run.gotoSymbols.map(() => '---').join('|'));
    for (let i = 0; i < run.gotoRows.length; i++) {
        const row = run.gotoRows[i];
        const values = run.gotoSymbols.map(symbol => row[symbol] === '' ? '' : String(row[symbol]));
        lines.push(`${row.state} | ${values.join(' | ')}`);
    }

    lines.push('');
    lines.push('Parsing Steps:');
    lines.push('Step | State Stack | Symbol Stack | Remaining Input | Action');
    lines.push('-----|-------------|--------------|-----------------|-------');

    for (let i = 0; i < run.steps.length; i++) {
        const step = run.steps[i];
        const stateStack = step.stack.join(' ');
        const symbolStack = step.symbols.length > 0 ? step.symbols.join(' ') : 'e';
        lines.push(`${step.step} | ${stateStack} | ${symbolStack} | ${step.input} | ${step.action}`);
    }

    return lines.join('\n');
}

function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function saveParsingStepsLocally() {
    if (!lastParsingRun || !lastParsingRun.steps || lastParsingRun.steps.length === 0) {
        if (typeof setStatusBar === 'function') {
            setStatusBar('No parsing steps available. Run parse first.', 'warning');
        }
        return;
    }

    if (!lastParsingRun.grammarIsValid) {
        if (typeof setStatusBar === 'function') {
            setStatusBar('Cannot save. Save/export allowed only for conflict-free valid grammar.', 'warning');
        }
        return;
    }

    const STORAGE_KEY = 'lr-parser-saved-runs';
    const existing = localStorage.getItem(STORAGE_KEY);
    const savedRuns = existing ? JSON.parse(existing) : [];

    savedRuns.push(lastParsingRun);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRuns));

    if (typeof setStatusBar === 'function') {
        setStatusBar('Full parsing steps saved to browser storage.', 'success');
    }
}

function exportParsingStepsToFile() {
    if (!lastParsingRun || !lastParsingRun.steps || lastParsingRun.steps.length === 0) {
        if (typeof setStatusBar === 'function') {
            setStatusBar('No parsing steps available. Run parse first.', 'warning');
        }
        return;
    }

    if (!lastParsingRun.grammarIsValid) {
        if (typeof setStatusBar === 'function') {
            setStatusBar('Cannot export. Save/export allowed only for conflict-free valid grammar.', 'warning');
        }
        return;
    }

    const stamp = lastParsingRun.timestamp
        .replace(/:/g, '-')
        .replace(/\.\d+Z$/, 'Z');
    const filename = `parsing-steps-${lastParsingRun.parserType}-${stamp}.txt`;
    const content = formatParsingRunAsText(lastParsingRun);

    downloadTextFile(filename, content);

    if (typeof setStatusBar === 'function') {
        setStatusBar('Full parsing steps exported as text file.', 'success');
    }
}

function simulateParsing(tokens) {
    const stack = [0]; // State stack
    const symbolStack = []; // Symbol stack
    const nodeStack = []; // Parse tree node stack
    const steps = [];
    let inputIndex = 0;
    
    const MAX_STEPS = 1000;
    let stepCount = 0;
    
    while (stepCount < MAX_STEPS) {
        stepCount++;
        
        const currentState = stack[stack.length - 1];
        const currentSymbol = tokens[inputIndex];
        
        // Record current configuration
        const step = {
            step: stepCount,
            stack: [...stack],
            symbols: [...symbolStack],
            input: tokens.slice(inputIndex).join(' '),
            action: ''
        };
        
        // Check action table
        const action = actionTable[currentState][currentSymbol];
        
        if (!action) {
            step.action = 'ERROR: No action defined';
            steps.push(step);
            return { steps, parseTree: null };
        }
        
        if (action === 'acc') {
            step.action = 'ACCEPT';
            steps.push(step);
            const rootNode = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1] : null;
            return { steps, parseTree: rootNode };
        }
        
        if (action.startsWith('s')) {
            // Shift
            const nextState = parseInt(action.substring(1));
            stack.push(nextState);
            symbolStack.push(currentSymbol);
            nodeStack.push({ symbol: currentSymbol, children: [] });
            step.action = `Shift ${nextState}`;
            inputIndex++;
            
        } else if (action.startsWith('r')) {
            // Reduce
            const prodIndex = parseInt(action.substring(1));
            const production = getProductionByIndex(prodIndex);
            
            if (!production) {
                step.action = 'ERROR: Invalid production';
                steps.push(step);
                return { steps, parseTree: null };
            }
            
            const { lhs, rhs } = production;
            
            // Pop from stack
            let popCount = rhs.length;
            if (rhs.length === 1 && rhs[0] === 'ε') {
                popCount = 0;
            }

            const children = [];
            
            for (let i = 0; i < popCount; i++) {
                stack.pop();
                symbolStack.pop();
                children.unshift(nodeStack.pop());
            }

            if (popCount === 0) {
                children.push({ symbol: 'ε', children: [] });
            }
            
            // Push LHS symbol
            symbolStack.push(lhs);
            nodeStack.push({ symbol: lhs, children });
            
            // Goto
            const gotoState = stack[stack.length - 1];
            const nextState = gotoTable[gotoState][lhs];
            
            if (nextState === undefined) {
                step.action = `ERROR: No goto for ${lhs}`;
                steps.push(step);
                return { steps, parseTree: null };
            }
            
            stack.push(nextState);
            step.action = `Reduce ${lhs} → ${rhs.join(' ')}`;
            
        } else {
            step.action = 'ERROR: Invalid action';
            steps.push(step);
            return { steps, parseTree: null };
        }
        
        steps.push(step);
        
        // Check if we consumed all input
        if (inputIndex >= tokens.length) {
            break;
        }
    }
    
    if (stepCount >= MAX_STEPS) {
        steps.push({
            step: stepCount + 1,
            stack: [...stack],
            symbols: [...symbolStack],
            input: tokens.slice(inputIndex).join(' '),
            action: 'ERROR: Maximum steps exceeded'
        });
    }

    return { steps, parseTree: null };
}
