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
