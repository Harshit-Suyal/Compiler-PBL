// ============================================
// GRAMMAR PARSING, VALIDATION, AND AUGMENTATION
// ============================================

function parseGrammar(input) {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);    
    if (lines.length === 0) {
        throw new Error('Grammar cannot be empty');
    }
    const parsedGrammar = {};
    const allNonTerminals = new Set();
    const usedSymbols = new Set();
    for (let line of lines) {
        // Check for arrow format
        if (!line.includes('->')) {
            throw new Error(`Invalid production format: ${line}. Expected '->'`);
        }
        const parts = line.split('->').map(p => p.trim());
        
        if (parts.length !== 2) {
            throw new Error(`Invalid production: ${line}`);
        }
        
        const lhs = parts[0].trim();
        const rhsPart = parts[1].trim();
        
        // Validate LHS is a non-terminal (uppercase)
        if (!lhs || lhs.length === 0) {
            throw new Error('LHS cannot be empty');
        }
        
        if (!/^[A-Z][A-Z0-9]*'*$/.test(lhs)) {
            throw new Error(`LHS must be a non-terminal (uppercase): ${lhs}`);
        }
        allNonTerminals.add(lhs);
        // Parse alternatives
        const alternatives = rhsPart.split('|').map(alt => alt.trim());
        
        for (let alt of alternatives) {
            if (alt.length === 0) {
                throw new Error(`Empty alternative in production: ${line}`);
            }
            
            // Tokenize the RHS
            const tokens = tokenize(alt);
            
            // Track used symbols
            for (let token of tokens) {
                if (token !== 'ε') {
                    usedSymbols.add(token);
                }
            }
            
            // Add to grammar
            if (!parsedGrammar[lhs]) {
                parsedGrammar[lhs] = [];
            }
            
            // Check for duplicates
            const prodStr = tokens.join(' ');
            const exists = parsedGrammar[lhs].some(prod => prod.join(' ') === prodStr);
            
            if (!exists) {
                parsedGrammar[lhs].push(tokens);
            }
        }
    }
    
    // Identify terminals and non-terminals
    for (let symbol of usedSymbols) {
        if (!/^[A-Z][A-Z0-9]*'*$/.test(symbol)) {
            terminals.add(symbol);
        } else {
            allNonTerminals.add(symbol);
        }
    }
    
    // Check for undefined non-terminals
    for (let nt of allNonTerminals) {
        if (!parsedGrammar[nt] && nt !== startSymbol + "'") {
            throw new Error(`Non-terminal '${nt}' is used but not defined`);
        }
    }
    
    nonTerminals = allNonTerminals;
    
    return parsedGrammar;
}

function tokenize(str) {
    const tokens = [];
    let i = 0;
    
    while (i < str.length) {
        // Skip whitespace
        if (/\s/.test(str[i])) {
            i++;
            continue;
        }
        
        // Check for epsilon
        if (str[i] === 'ε') {
            tokens.push('ε');
            i++;
            continue;
        }
        
        // Check for multi-character terminals like 'id', 'num'
        let matched = false;
        for (let len = Math.min(3, str.length - i); len > 0; len--) {
            const substr = str.substr(i, len);
            if (/^[a-z][a-z0-9]*$/.test(substr)) {
                tokens.push(substr);
                i += len;
                matched = true;
                break;
            }
        }
        
        if (matched) continue;
        
        // Check for non-terminals (uppercase, can have prime)
        if (/[A-Z]/.test(str[i])) {
            let token = str[i];
            i++;
            while (i < str.length && (/[A-Z0-9']/.test(str[i]))) {
                token += str[i];
                i++;
            }
            tokens.push(token);
            continue;
        }
        
        // Single character (operator, parenthesis, etc.)
        tokens.push(str[i]);
        i++;
    }
    
    return tokens;
}

function parsePrecedence(input) {
    const prec = {};
    
    if (!input || input.trim().length === 0) {
        return prec;
    }
    
    const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let line of lines) {
        const parts = line.split(/\s+/);
        
        if (parts.length !== 3) {
            throw new Error(`Invalid precedence format: ${line}. Expected: operator level associativity`);
        }
        
        const [operator, level, assoc] = parts;
        const levelNum = parseInt(level);
        
        if (isNaN(levelNum)) {
            throw new Error(`Invalid precedence level: ${level}`);
        }
        
        if (!['left', 'right', 'none'].includes(assoc.toLowerCase())) {
            throw new Error(`Invalid associativity: ${assoc}. Must be 'left', 'right', or 'none'`);
        }
        
        prec[operator] = {
            level: levelNum,
            assoc: assoc.toLowerCase()
        };
    }
    
    return prec;
}

function computeProductionPrecedence() {
    // Assign precedence to each production based on rightmost terminal
    const prodPrec = [];
    
    for (let lhs in augmentedGrammar) {
        const productions = augmentedGrammar[lhs];
        
        for (let prod of productions) {
            let precInfo = null;
            
            // Find rightmost terminal with precedence
            for (let i = prod.length - 1; i >= 0; i--) {
                if (precedence[prod[i]]) {
                    precInfo = precedence[prod[i]];
                    break;
                }
            }
            
            prodPrec.push(precInfo);
        }
    }
    
    return prodPrec;
}

function augmentGrammar(originalGrammar) {
    const augmented = {};
    const firstLHS = Object.keys(originalGrammar)[0];
    startSymbol = firstLHS;
    
    const augmentedStart = firstLHS + "'";
    augmented[augmentedStart] = [[firstLHS]];
    
    // Copy original grammar
    for (let lhs in originalGrammar) {
        augmented[lhs] = originalGrammar[lhs].map(prod => [...prod]);
    }
    
    nonTerminals.add(augmentedStart);
    
    return augmented;
}
