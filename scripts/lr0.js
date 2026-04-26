// ============================================
// LR ITEM CONSTRUCTION (LR(0), LR(1), LALR)
// ============================================

class Item {
    constructor(lhs, rhs, dot) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dot = dot;
    }
    
    toString() {
        const before = this.rhs.slice(0, this.dot).join(' ');
        const after = this.rhs.slice(this.dot).join(' ');
        return `${this.lhs} -> ${before} • ${after}`.trim();
    }
    
    equals(other) {
        return this.lhs === other.lhs &&
               this.dot === other.dot &&
               this.rhs.length === other.rhs.length &&
               this.rhs.every((val, idx) => val === other.rhs[idx]);
    }
    
    getNextSymbol() {
        if (this.dot < this.rhs.length) {
            return this.rhs[this.dot];
        }
        return null;
    }
    
    isComplete() {
        return this.dot >= this.rhs.length || 
               (this.dot === 1 && this.rhs.length === 1 && this.rhs[0] === 'ε');
    }
}

class LR1Item {
    constructor(lhs, rhs, dot, lookahead) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dot = dot;
        this.lookahead = lookahead;
    }

    toString() {
        const before = this.rhs.slice(0, this.dot).join(' ');
        const after = this.rhs.slice(this.dot).join(' ');
        return `${this.lhs} -> ${before} • ${after}, ${this.lookahead}`.trim();
    }

    equals(other) {
        return this.lhs === other.lhs &&
               this.dot === other.dot &&
               this.lookahead === other.lookahead &&
               this.rhs.length === other.rhs.length &&
               this.rhs.every((val, idx) => val === other.rhs[idx]);
    }

    getNextSymbol() {
        if (this.dot < this.rhs.length) {
            return this.rhs[this.dot];
        }
        return null;
    }

    isComplete() {
        return this.dot >= this.rhs.length ||
               (this.dot === 1 && this.rhs.length === 1 && this.rhs[0] === 'ε');
    }
}

function closureLR0(items) {
    const result = [...items];
    const processed = new Set();

    let i = 0;
    while (i < result.length) {
        const item = result[i];
        const next = item.getNextSymbol();
        
        if (next && nonTerminals.has(next) && !processed.has(next)) {
            processed.add(next);
            
            if (augmentedGrammar[next]) {
                for (let prod of augmentedGrammar[next]) {
                    const newItem = new Item(next, prod, 0);

                    const exists = result.some(existing => existing.equals(newItem));
                    if (!exists) {
                        result.push(newItem);
                    }
                }
            }
        }
        
        i++;
    }
    
    return result;
}

    function gotoStateLR0(items, symbol) {
    const movedItems = [];

    for (let item of items) {
        if (item.getNextSymbol() === symbol) {
            const newItem = new Item(
                item.lhs,
                item.rhs,
                item.dot + 1
            );
            movedItems.push(newItem);
        }
    }
    
    if (movedItems.length === 0) {
        return null;
    }

    return closureLR0(movedItems);
}

function getFirstForLR1Sequence(sequence) {
    const first = computeFirstOfSequence(sequence, firstSets);
    const result = new Set();

    for (let symbol of first) {
        if (symbol !== 'ε') {
            result.add(symbol);
        }
    }

    return result;
}

function closureLR1(items) {
    const result = [...items];
    let changed = true;

    while (changed) {
        changed = false;

        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            const next = item.getNextSymbol();

            if (!next || !nonTerminals.has(next) || !augmentedGrammar[next]) {
                continue;
            }

            const beta = item.rhs.slice(item.dot + 1);
            const lookaheadSequence = [...beta, item.lookahead];
            const lookaheads = getFirstForLR1Sequence(lookaheadSequence);

            for (let prod of augmentedGrammar[next]) {
                for (let la of lookaheads) {
                    const newItem = new LR1Item(next, prod, 0, la);
                    const exists = result.some(existing => existing.equals(newItem));

                    if (!exists) {
                        result.push(newItem);
                        changed = true;
                    }
                }
            }
        }
    }

    return result;
}

function gotoStateLR1(items, symbol) {
    const movedItems = [];

    for (let item of items) {
        if (item.getNextSymbol() === symbol) {
            movedItems.push(new LR1Item(item.lhs, item.rhs, item.dot + 1, item.lookahead));
        }
    }

    if (movedItems.length === 0) {
        return null;
    }

    return closureLR1(movedItems);
}

function statesEqual(state1, state2) {
    if (state1.length !== state2.length) return false;
    
    for (let item1 of state1) {
        const found = state2.some(item2 => item1.equals(item2));
        if (!found) return false;
    }
    
    return true;
}

    function stateCoreKey(state) {
        // LALR merging must compare LR(0) cores as a set, not by LR(1) item count.
        const coreParts = new Set(
            state.map(item => `${item.lhs}->${item.rhs.join(' ')}@${item.dot}`)
        );

        return Array.from(coreParts).sort().join('|');
    }

    function buildCanonicalCollectionLR0() {
    const states = [];
        const transitions = {};
    const augStart = startSymbol + "'";

    const initialItem = new Item(augStart, [startSymbol], 0);
        const I0 = closureLR0([initialItem]);
    states.push(I0);

    let i = 0;
    while (i < states.length) {
        const currentState = states[i];
            transitions[i] = {};

        const symbols = new Set();
        for (let item of currentState) {
            const next = item.getNextSymbol();
            if (next) {
                symbols.add(next);
            }
        }

        for (let symbol of symbols) {
            const nextState = gotoStateLR0(currentState, symbol);

            if (nextState && nextState.length > 0) {
                let existingIndex = -1;
                for (let j = 0; j < states.length; j++) {
                    if (statesEqual(states[j], nextState)) {
                        existingIndex = j;
                        break;
                    }
                }

                if (existingIndex === -1) {
                    states.push(nextState);
                    existingIndex = states.length - 1;
                }

                transitions[i][symbol] = existingIndex;
            }
        }

        i++;
    }

    return { states, transitions };
}

function buildCanonicalCollectionLR1() {
    const states = [];
    const transitions = {};
    const augStart = startSymbol + "'";

    const initialItem = new LR1Item(augStart, [startSymbol], 0, '$');
    const I0 = closureLR1([initialItem]);
    states.push(I0);

    let i = 0;
    while (i < states.length) {
        const currentState = states[i];
        transitions[i] = {};

        const symbols = new Set();
        for (let item of currentState) {
            const next = item.getNextSymbol();
            if (next && next !== 'ε') {
                symbols.add(next);
            }
        }

        for (let symbol of symbols) {
            const nextState = gotoStateLR1(currentState, symbol);

            if (nextState && nextState.length > 0) {
                let existingIndex = -1;
                for (let j = 0; j < states.length; j++) {
                    if (statesEqual(states[j], nextState)) {
                        existingIndex = j;
                        break;
                    }
                }

                if (existingIndex === -1) {
                    states.push(nextState);
                    existingIndex = states.length - 1;
                }

                transitions[i][symbol] = existingIndex;
            }
        }

        i++;
    }

    return { states, transitions };
}

function mergeLR1StatesToLALR(lr1States, lr1Transitions) {
    const coreToMerged = {};
    const mergedStates = [];

    for (let i = 0; i < lr1States.length; i++) {
        const key = stateCoreKey(lr1States[i]);
        if (coreToMerged[key] === undefined) {
            coreToMerged[key] = mergedStates.length;
            mergedStates.push([]);
        }
    }

    for (let i = 0; i < lr1States.length; i++) {
        const key = stateCoreKey(lr1States[i]);
        const mergedIndex = coreToMerged[key];
        const target = mergedStates[mergedIndex];

        for (let item of lr1States[i]) {
            const exists = target.some(existing => existing.equals(item));
            if (!exists) {
                target.push(item);
            }
        }
    }

    const mergedTransitions = {};
    for (let i = 0; i < lr1States.length; i++) {
        const sourceKey = stateCoreKey(lr1States[i]);
        const mergedSource = coreToMerged[sourceKey];
        mergedTransitions[mergedSource] = mergedTransitions[mergedSource] || {};

        const row = lr1Transitions[i] || {};
        for (let symbol in row) {
            const targetLR1 = row[symbol];
            const targetKey = stateCoreKey(lr1States[targetLR1]);
            const mergedTarget = coreToMerged[targetKey];
            mergedTransitions[mergedSource][symbol] = mergedTarget;
        }
    }

    return { states: mergedStates, transitions: mergedTransitions };
}

function buildItemSetsForMode(mode) {
    if (mode === 'CLR') {
        return buildCanonicalCollectionLR1();
    }

    if (mode === 'LALR') {
        const lr1Collection = buildCanonicalCollectionLR1();
        return mergeLR1StatesToLALR(lr1Collection.states, lr1Collection.transitions);
    }

    return buildCanonicalCollectionLR0();
}

function getProductionIndex(lhs, rhs) {
    let index = 0;
    
    for (let nt in augmentedGrammar) {
        const productions = augmentedGrammar[nt];
        
        for (let prod of productions) {
            if (nt === lhs && 
                prod.length === rhs.length && 
                prod.every((val, idx) => val === rhs[idx])) {
                return index;
            }
            index++;
        }
    }
    
    return -1;
}

function getProductionByIndex(index) {
    let currentIndex = 0;
    
    for (let lhs in augmentedGrammar) {
        const productions = augmentedGrammar[lhs];
        
        for (let rhs of productions) {
            if (currentIndex === index) {
                return { lhs, rhs };
            }
            currentIndex++;
        }
    }
    
    return null;
}

    function buildCanonicalCollection() {
        const collection = buildItemSetsForMode(parserMode);
        return collection.states;
    }

    function findStateIndex(state, states) {
        if (!state) return -1;

        const sourceStates = states || parserStates;
        for (let i = 0; i < sourceStates.length; i++) {
            if (statesEqual(sourceStates[i], state)) {
                return i;
            }
        }

        return -1;
    }
