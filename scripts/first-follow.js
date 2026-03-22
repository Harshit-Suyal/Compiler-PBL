// ============================================
// FIRST AND FOLLOW SET COMPUTATION
// ============================================

function computeFirstSets() {
    const first = {};
    
    // Initialize
    for (let nt of nonTerminals) {
        first[nt] = new Set();
    }
    
    for (let t of terminals) {
        first[t] = new Set([t]);
    }
    
    // Epsilon
    first['ε'] = new Set(['ε']);
    
    // Iteratively compute FIRST sets
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100;
    
    while (changed && iterations < MAX_ITERATIONS) {
        changed = false;
        iterations++;
        
        for (let lhs in augmentedGrammar) {
            const productions = augmentedGrammar[lhs];
            
            for (let prod of productions) {
                const result = computeFirstOfSequence(prod, first);
                
                for (let symbol of result) {
                    if (!first[lhs].has(symbol)) {
                        first[lhs].add(symbol);
                        changed = true;
                    }
                }
            }
        }
    }
    
    return first;
}

function computeFirstOfSequence(sequence, first) {
    const result = new Set();
    
    if (sequence.length === 0 || (sequence.length === 1 && sequence[0] === 'ε')) {
        result.add('ε');
        return result;
    }
    
    for (let i = 0; i < sequence.length; i++) {
        const symbol = sequence[i];
        
        if (symbol === 'ε') {
            result.add('ε');
            break;
        }
        
        // If symbol is terminal
        if (terminals.has(symbol) || !nonTerminals.has(symbol)) {
            if (first[symbol]) {
                for (let f of first[symbol]) {
                    if (f !== 'ε') result.add(f);
                }
            } else {
                result.add(symbol);
            }
            break;
        }
        
        // Symbol is non-terminal
        if (first[symbol]) {
            let hasEpsilon = false;
            for (let f of first[symbol]) {
                if (f === 'ε') {
                    hasEpsilon = true;
                } else {
                    result.add(f);
                }
            }
            
            if (!hasEpsilon) {
                break;
            }
            
            // If this is the last symbol and it has epsilon
            if (i === sequence.length - 1) {
                result.add('ε');
            }
        } else {
            break;
        }
    }
    
    return result;
}

function computeFollowSets() {
    const follow = {};
    
    // Initialize
    for (let nt of nonTerminals) {
        follow[nt] = new Set();
    }
    
    // Add $ to start symbol
    const augStart = startSymbol + "'";
    follow[augStart].add('$');
    
    // Iteratively compute FOLLOW sets
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100;
    
    while (changed && iterations < MAX_ITERATIONS) {
        changed = false;
        iterations++;
        
        for (let lhs in augmentedGrammar) {
            const productions = augmentedGrammar[lhs];
            
            for (let prod of productions) {
                for (let i = 0; i < prod.length; i++) {
                    const symbol = prod[i];
                    
                    // Only process non-terminals
                    if (!nonTerminals.has(symbol)) continue;
                    
                    // Get beta (rest of production after current symbol)
                    const beta = prod.slice(i + 1);
                    
                    if (beta.length === 0) {
                        // A -> αB
                        // Add FOLLOW(A) to FOLLOW(B)
                        for (let f of follow[lhs]) {
                            if (!follow[symbol].has(f)) {
                                follow[symbol].add(f);
                                changed = true;
                            }
                        }
                    } else {
                        // A -> αBβ
                        // Add FIRST(β) - {ε} to FOLLOW(B)
                        const firstBeta = computeFirstOfSequence(beta, firstSets);
                        
                        let hasEpsilon = false;
                        for (let f of firstBeta) {
                            if (f === 'ε') {
                                hasEpsilon = true;
                            } else {
                                if (!follow[symbol].has(f)) {
                                    follow[symbol].add(f);
                                    changed = true;
                                }
                            }
                        }
                        
                        // If ε in FIRST(β), add FOLLOW(A) to FOLLOW(B)
                        if (hasEpsilon) {
                            for (let f of follow[lhs]) {
                                if (!follow[symbol].has(f)) {
                                    follow[symbol].add(f);
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return follow;
}
