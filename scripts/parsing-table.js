// ============================================
// LR PARSING TABLE (SLR / CLR / LALR) WITH CONFLICT RESOLUTION
// ============================================

function getReduceSymbols(item, mode) {
    if (mode === 'SLR') {
        return followSets[item.lhs] || new Set();
    }

    const reduceSymbols = new Set();
    if (item.lookahead) {
        reduceSymbols.add(item.lookahead);
    }
    return reduceSymbols;
}

function buildParsingTable(mode = parserMode, states = parserStates, transitions = stateTransitions) {
    const action = {};
    const goto = {};
    const conflictList = [];
    const resolvedList = [];

    for (let i = 0; i < states.length; i++) {
        action[i] = {};
        goto[i] = {};
    }
    const augStart = startSymbol + "'";
    for (let i = 0; i < states.length; i++) {
        const state = states[i];
        const transitionRow = transitions[i] || {};
        for (let item of state) {
            const next = item.getNextSymbol();

            if (next) {
                if (terminals.has(next) || (!nonTerminals.has(next) && next !== 'ε')) {
                    const nextIndex = transitionRow[next];

                    if (nextIndex !== undefined) {
                        const entry = `s${nextIndex}`;

                        if (action[i][next] && action[i][next] !== entry) {
                            const resolved = resolveConflict(
                                i, next, action[i][next], entry, 'shift'
                            );

                            if (resolved.resolved) {
                                action[i][next] = resolved.action;
                                resolvedList.push(resolved);
                            } else {
                                conflictList.push({
                                    state: i,
                                    symbol: next,
                                    existing: action[i][next],
                                    new: entry,
                                    type: action[i][next].startsWith('r') ? 'shift-reduce' : 'shift-shift'
                                });
                            }
                        } else {
                            action[i][next] = entry;
                        }
                    }
                } else if (nonTerminals.has(next)) {
                    const nextIndex = transitionRow[next];

                    if (nextIndex !== undefined) {
                        goto[i][next] = nextIndex;
                    }
                }
            } else {
                if (item.lhs === augStart && item.isComplete() && (mode === 'SLR' || item.lookahead === '$')) {
                    if (action[i]['$'] && action[i]['$'] !== 'acc') {
                        conflictList.push({
                            state: i,
                            symbol: '$',
                            existing: action[i]['$'],
                            new: 'acc',
                            type: 'accept-conflict'
                        });
                    }
                    action[i]['$'] = 'acc';
                } else if (item.isComplete()) {
                    const prodIndex = getProductionIndex(item.lhs, item.rhs);
                    const entry = `r${prodIndex}`;

                    const reduceSymbols = getReduceSymbols(item, mode);
                    for (let symbol of reduceSymbols) {
                        if (action[i][symbol] && action[i][symbol] !== entry) {
                            const resolved = resolveConflict(
                                i, symbol, action[i][symbol], entry, 'reduce', prodIndex
                            );

                            if (resolved.resolved) {
                                action[i][symbol] = resolved.action;
                                resolvedList.push(resolved);
                            } else {
                                const existingEntry = action[i][symbol];
                                let conflictType = 'reduce-reduce';

                                if (existingEntry.startsWith('s')) {
                                    conflictType = 'shift-reduce';
                                } else if (existingEntry === 'acc') {
                                    conflictType = 'accept-reduce';
                                }
                                
                                conflictList.push({
                                    state: i,
                                    symbol: symbol,
                                    existing: existingEntry,
                                    new: entry,
                                    type: conflictType
                                });
                            }
                        } else {
                            action[i][symbol] = entry;
                        }
                    }
                }
            }
        }
    }

    return { action, goto, conflicts: conflictList, resolved: resolvedList };
}

function resolveConflict(state, symbol, existing, newAction, newType, prodIndex = null) {
    const isShiftReduce = (existing.startsWith('s') && newAction.startsWith('r')) ||
                          (existing.startsWith('r') && newAction.startsWith('s'));
    
    if (!isShiftReduce || !precedence[symbol]) {
        return { resolved: false };
    }
    
    let shiftAction, reduceAction, reduceProdIndex;
    
    if (existing.startsWith('s')) {
        shiftAction = existing;
        reduceAction = newAction;
        reduceProdIndex = newType === 'reduce' ? prodIndex : parseInt(newAction.substring(1));
    } else {
        shiftAction = newAction;
        reduceAction = existing;
        reduceProdIndex = parseInt(existing.substring(1));
    }
    
    const symbolPrec = precedence[symbol];
    const prodPrec = productionPrecedence[reduceProdIndex];
    
    if (!prodPrec) {
        return { resolved: false };
    }
    
    let chosenAction;
    let reason;
    
    if (symbolPrec.level > prodPrec.level) {
        // Shift has higher precedence
        chosenAction = shiftAction;
        reason = `Shift (${symbol} has higher precedence)`;
    } else if (symbolPrec.level < prodPrec.level) {
        // Reduce has higher precedence
        chosenAction = reduceAction;
        reason = `Reduce (production has higher precedence)`;
    } else {
        // Same precedence - use associativity
        if (symbolPrec.assoc === 'left') {
            chosenAction = reduceAction;
            reason = `Reduce (left associative)`;
        } else if (symbolPrec.assoc === 'right') {
            chosenAction = shiftAction;
            reason = `Shift (right associative)`;
        } else {
            return { resolved: false };
        }
    }
    
    return {
        resolved: true,
        action: chosenAction,
        state: state,
        symbol: symbol,
        existing: existing,
        new: newAction,
        chosen: chosenAction,
        reason: reason
    };
}
