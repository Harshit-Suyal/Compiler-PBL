// ============================================
// DISPLAY AND UI FUNCTIONS
// ============================================

function displayResults() {
    // Display status
    displayStatus();
    
    // Display augmented grammar
    displayAugmentedGrammar();
    
    // Display FIRST sets
    displayFirstSets();
    
    // Display FOLLOW sets
    displayFollowSets();
    
    // Display LR(0) states
    displayLR0States();

    // Display transitions
    displayTransitions();
    
    // Display parsing tables
    displayActionTable();
    displayGotoTable();
    
    // Display conflicts
    displayConflicts();

    // Display comparison
    displayAlgorithmComparison();

    // Reset parse tree area until parse action
    displayParseTree();
}

function explainBlock(title, whatText, whyText) {
    return `
        <div class="explain-card">
            <h4>${escapeHtml(title)}</h4>
            <p><strong>What:</strong> ${escapeHtml(whatText)}</p>
            <p><strong>Why:</strong> ${escapeHtml(whyText)}</p>
        </div>
    `;
}

function displayStatus() {
    const statusDiv = document.getElementById('statusBar');
    if (!statusDiv) return;
    
    const modeLabel = parserMode === 'CLR' ? 'CLR(1)' : parserMode;

    if (conflicts.length === 0) {
        statusDiv.className = 'status-bar success';
        if (resolvedConflicts.length > 0) {
            statusDiv.innerHTML = `✔ Grammar parsed successfully in ${modeLabel}. ${resolvedConflicts.length} conflict(s) resolved.`;
        } else {
            statusDiv.innerHTML = `✔ Grammar parsed successfully in ${modeLabel}.`;
        }
    } else {
        statusDiv.className = 'status-bar warning';
        statusDiv.innerHTML = `⚠ Conflict detected. Grammar is not ${modeLabel} without conflicts.`;
    }
}

function displayAugmentedGrammar() {
    const div = document.getElementById('augmentedGrammar');
    if (!div) return;

    let html = explainBlock(
        'Augmented Grammar',
        'Adds a new start production S\' -> S and normalizes input productions.',
        'Augmentation is required so ACCEPT can be detected when parsing finishes at the new start rule.'
    );
    html += '<pre>';
    
    for (let lhs in augmentedGrammar) {
        const productions = augmentedGrammar[lhs];
        
        for (let i = 0; i < productions.length; i++) {
            const rhs = productions[i].join(' ');
            html += `${lhs} → ${rhs}\n`;
        }
    }
    
    html += '</pre>';
    div.innerHTML = html;
}

function displayFirstSets() {
    const div = document.getElementById('firstSets');
    if (!div) return;
    let html = explainBlock(
        'FIRST Sets',
        'Shows which terminals can appear first from each non-terminal.',
        'FIRST helps compute lookaheads and parse decisions during table construction.'
    );
    html += '<pre>';
    for (let nt of Array.from(nonTerminals).sort()) {
        if (firstSets[nt]) {
            const first = Array.from(firstSets[nt]).sort().join(', ');
            html += `FIRST(${nt}) = { ${first} }\n`;
        }
    }
    html += '</pre>';
    div.innerHTML = html;
}

function displayFollowSets() {
    const div = document.getElementById('followSets');
    if (!div) return;

    let html = explainBlock(
        'FOLLOW Sets',
        'Shows which terminals can appear immediately after each non-terminal.',
        'SLR reduction rules use FOLLOW symbols to decide valid reduce entries.'
    );
    html += '<pre>';
    
    for (let nt of Array.from(nonTerminals).sort()) {
        if (followSets[nt]) {
            const follow = Array.from(followSets[nt]).sort().join(', ');
            html += `FOLLOW(${nt}) = { ${follow} }\n`;
        }
    }
    
    html += '</pre>';
    div.innerHTML = html;
}

function compareLookaheads(a, b) {
    // Keep end marker at the end for readable output like c/d/$.
    if (a === '$' && b !== '$') return 1;
    if (a !== '$' && b === '$') return -1;
    return a.localeCompare(b);
}

function compactLALRStateItemsForDisplay(stateItems) {
    const grouped = new Map();

    for (let item of stateItems) {
        const key = `${item.lhs}->${item.rhs.join(' ')}@${item.dot}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                lhs: item.lhs,
                rhs: item.rhs,
                dot: item.dot,
                lookaheads: new Set()
            });
        }

        if (item.lookahead) {
            grouped.get(key).lookaheads.add(item.lookahead);
        }
    }

    const compacted = [];
    for (let groupedItem of grouped.values()) {
        compacted.push({
            lhs: groupedItem.lhs,
            rhs: groupedItem.rhs,
            dot: groupedItem.dot,
            lookaheadText: Array.from(groupedItem.lookaheads).sort(compareLookaheads).join('/')
        });
    }

    return compacted;
}

function formatStateItemForDisplay(item) {
    if (typeof item.toString === 'function' && item.toString !== Object.prototype.toString) {
        return item.toString();
    }

    const before = item.rhs.slice(0, item.dot).join(' ');
    const after = item.rhs.slice(item.dot).join(' ');
    const coreText = `${item.lhs} -> ${before} • ${after}`.trim();

    if (item.lookaheadText) {
        return `${coreText}, ${item.lookaheadText}`;
    }

    return coreText;
}

function displayLR0States() {
    const div = document.getElementById('lr0States');
    if (!div) return;

    let html = '';

    const title = parserMode === 'SLR' ? 'LR(0)' : 'LR(1)';
    html += explainBlock(
        'Canonical Item Sets',
        `Displays all parser states as ${title} items with dot positions.`,
        'The dot marks parser progress; closure items appear when the dot is before a non-terminal.'
    );
    html += `<p style="margin-bottom: 12px;"><strong>Mode:</strong> ${parserMode} (${title} items)</p>`;
    
    for (let i = 0; i < parserStates.length; i++) {
        html += `<div class="state-card">`;
        html += `<h4>I${i}</h4>`;
        html += '<pre class="state-items">';

        const itemsToDisplay = parserMode === 'LALR'
            ? compactLALRStateItemsForDisplay(parserStates[i])
            : parserStates[i];

        for (let item of itemsToDisplay) {
            const itemText = escapeHtml(formatStateItemForDisplay(item)).replace('•', '<span class="dot">•</span>');
            const isClosureLike = item.dot === 0 && item.lhs !== `${startSymbol}'`;
            const itemClass = isClosureLike ? 'item-closure' : 'item-core';
            html += `<span class="${itemClass}">${itemText}</span>\n`;
        }

        html += '</pre>';
        html += '</div>';
    }
    
    div.innerHTML = html;
}

function displayTransitions() {
    const div = document.getElementById('transitions');
    if (!div) return;

    let html = '';

    html += explainBlock(
        'DFA Transitions',
        'Shows goto transitions between parser states.',
        'Each transition indicates how the parser moves when reading a grammar symbol.'
    );

    const indices = Object.keys(stateTransitions)
        .map(num => parseInt(num))
        .sort((a, b) => a - b);

    if (indices.length === 0) {
        div.innerHTML = `${html}<p>No transitions available.</p>`;
        return;
    }

    const radius = Math.max(120, indices.length * 16);
    const center = radius + 50;
    const svgSize = center * 2;

    const nodePositions = {};
    for (let idx = 0; idx < indices.length; idx++) {
        const stateId = indices[idx];
        const angle = (2 * Math.PI * idx) / indices.length;
        nodePositions[stateId] = {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle)
        };
    }

    let svg = `<svg class="dfa-svg" viewBox="0 0 ${svgSize} ${svgSize}">`;

    for (let fromState of indices) {
        const row = stateTransitions[fromState] || {};
        const symbols = Object.keys(row).sort();

        for (let symbol of symbols) {
            const toState = row[symbol];
            const fromPos = nodePositions[fromState];
            const toPos = nodePositions[toState];
            if (!fromPos || !toPos) continue;

            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;

            svg += `<line class="dfa-link" x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}"></line>`;
            svg += `<text class="dfa-label" x="${midX}" y="${midY}">${escapeHtml(symbol)}</text>`;
        }
    }

    for (let stateId of indices) {
        const pos = nodePositions[stateId];
        svg += `<circle class="dfa-node" cx="${pos.x}" cy="${pos.y}" r="16"></circle>`;
        svg += `<text class="dfa-node-label" x="${pos.x}" y="${pos.y + 4}">I${stateId}</text>`;
    }

    svg += '</svg>';
    html += `<div class="dfa-canvas">${svg}</div>`;

    for (let fromState of indices) {
        const row = stateTransitions[fromState] || {};
        const symbols = Object.keys(row).sort();

        for (let symbol of symbols) {
            const toState = row[symbol];
            html += `<div class="transition-item">I${fromState} -- ${escapeHtml(symbol)} --> I${toState}</div>`;
        }
    }

    div.innerHTML = html || '<p>No transitions available.</p>';
}

function displayActionTable() {
    const div = document.getElementById('actionTable');
    if (!div) return;
    
    // Get all terminals + $
    const allTerminals = Array.from(terminals).sort();
    if (!allTerminals.includes('$')) {
        allTerminals.push('$');
    }
    
    let html = explainBlock(
        'ACTION Table',
        'Contains shift/reduce/accept actions for terminals in each state.',
        'This table drives runtime parsing decisions for the input stream.'
    );
    html += '<table>';
    html += '<thead><tr><th>State</th>';
    
    for (let t of allTerminals) {
        html += `<th>${escapeHtml(t)}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    for (let i = 0; i < parserStates.length; i++) {
        html += `<tr><td><strong>${i}</strong></td>`;
        
        for (let t of allTerminals) {
            const value = actionTable[i][t] || '';
            const isConflict = conflicts.some(c => c.state === i && c.symbol === t);
            let className = '';

            if (isConflict) {
                className = 'cell-conflict';
            } else if (value === 'acc') {
                className = 'cell-accept';
            } else if (value.startsWith('s')) {
                className = 'cell-shift';
            } else if (value.startsWith('r')) {
                className = 'cell-reduce';
            }
            
            html += `<td class="${className}">${escapeHtml(value)}</td>`;
        }
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    div.innerHTML = html;
}

function displayGotoTable() {
    const div = document.getElementById('gotoTable');
    if (!div) return;
    
    // Get all non-terminals except augmented start
    const augStart = startSymbol + "'";
    const allNonTerminals = Array.from(nonTerminals).filter(nt => nt !== augStart).sort();
    
    let html = explainBlock(
        'GOTO Table',
        'Contains state transitions for non-terminals after reductions.',
        'After a reduce action, parser uses GOTO to jump to the next valid state.'
    );
    html += '<table>';
    html += '<thead><tr><th>State</th>';
    
    for (let nt of allNonTerminals) {
        html += `<th>${escapeHtml(nt)}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    for (let i = 0; i < parserStates.length; i++) {
        html += `<tr><td><strong>${i}</strong></td>`;
        
        for (let nt of allNonTerminals) {
            const value = gotoTable[i][nt] !== undefined ? gotoTable[i][nt] : '';
            html += `<td>${value}</td>`;
        }
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    div.innerHTML = html;
}

function displayConflicts() {
    const div = document.getElementById('conflictDetails');
    if (!div) {
        return;
    }

    let html = explainBlock(
        'Conflict Analysis',
        'Lists shift-reduce or reduce-reduce conflicts found during table construction.',
        'Conflicts occur when parser decisions are ambiguous for a state and lookahead symbol.'
    );
    
    if (conflicts.length === 0 && resolvedConflicts.length === 0) {
        div.innerHTML = `${html}<p>No conflicts detected.</p>`;
        return;
    }
    
    // Display resolved conflicts
    if (resolvedConflicts.length > 0) {
        html += '<h4 style="color: #28a745; margin-bottom: 10px;">Resolved Conflicts (using precedence/associativity)</h4>';
        
        for (let resolved of resolvedConflicts) {
            html += `<div class="conflict-resolved">`;
            html += `<strong>SHIFT-REDUCE CONFLICT (RESOLVED)</strong><br>`;
            html += `State: I${resolved.state}, Symbol: ${escapeHtml(resolved.symbol)}<br>`;
            html += `Conflicting actions: ${escapeHtml(resolved.existing)} vs ${escapeHtml(resolved.new)}<br>`;
            html += `<span style="color: #28a745;">✓ Chosen: ${escapeHtml(resolved.chosen)} - ${escapeHtml(resolved.reason)}</span>`;
            html += `</div>`;
        }
    }
    
    // Display unresolved conflicts
    if (conflicts.length > 0) {
        html += '<h4 style="color: #dc3545; margin-top: 15px; margin-bottom: 10px;">❌ Unresolved Conflicts</h4>';
        
        for (let conflict of conflicts) {
            html += `<div class="conflict-item">`;
            html += `<strong>❌ ${conflict.type.toUpperCase()} in state I${conflict.state}</strong><br>`;
            html += `Symbol: ${escapeHtml(conflict.symbol)}<br>`;
            html += `Existing action: ${escapeHtml(conflict.existing)}<br>`;
            html += `Conflicting action: ${escapeHtml(conflict.new)}<br>`;
            html += `<em>Why: multiple parser decisions are valid for this state/symbol pair.</em>`;
            html += `</div>`;
        }
    }
    
    div.innerHTML = html;
}

function displayParsingSteps(steps) {
    const div = document.getElementById('parseResult');
    if (!div) return;
    
    if (steps.length === 0) {
        div.innerHTML = '<p>No parsing steps generated</p>';
        return;
    }
    
    const lastStep = steps[steps.length - 1];
    const accepted = lastStep.action === 'ACCEPT';
    
    let html = explainBlock(
        'Step-by-Step Parsing',
        'Each row shows parser stack, remaining input, and chosen action.',
        'Actions are selected from ACTION/GOTO tables until ACCEPT or ERROR.'
    );
    html += '<h4>Parsing Steps:</h4>';
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>Step</th>';
    html += '<th>State Stack</th>';
    html += '<th>Symbol Stack</th>';
    html += '<th>Input</th>';
    html += '<th>Action</th>';
    html += '</tr></thead><tbody>';
    
    for (let step of steps) {
        const isError = step.action.startsWith('ERROR');
        const isAccept = step.action === 'ACCEPT';
        const isCurrent = step.step === lastStep.step;
        const rowClass = isError ? 'step-error' : isAccept ? 'step-accept' : 'step-normal';
        const currentClass = isCurrent ? ' step-current' : '';
        const explanation = explainStepReason(step.action);
        
        html += `<tr class="${rowClass}${currentClass}">`;
        html += `<td>${step.step}</td>`;
        html += `<td>${escapeHtml(step.stack.join(' '))}</td>`;
        html += `<td>${escapeHtml(step.symbols.join(' ') || 'ε')}</td>`;
        html += `<td>${escapeHtml(step.input)}</td>`;
        html += `<td><strong>${escapeHtml(step.action)}</strong><br><span class="step-why">${escapeHtml(explanation)}</span></td>`;
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
    if (accepted) {
        html += '<p class="parse-accept"> INPUT ACCEPTED - String is valid!</p>';
    } else {
        html += '<p class="parse-reject"> INPUT REJECTED - String is invalid!</p>';
    }
    
    div.innerHTML = html;
}

function explainStepReason(action) {
    if (action === 'ACCEPT') {
        return 'Input is fully matched and parser reached accept state.';
    }
    if (action.startsWith('Shift')) {
        return 'Shift moves next input symbol onto stack and transitions to a new state.';
    }
    if (action.startsWith('Reduce')) {
        return 'Reduce applies a completed production because dot reached end of rule.';
    }
    if (action.startsWith('ERROR')) {
        return 'No valid action exists for current state and lookahead symbol.';
    }
    return 'Parser continues according to table-driven decision.';
}

function renderTreeNode(node) {
    if (!node) {
        return null;
    }
    const mappedNode = {
        name: node.symbol,
        children: []
    };
    if (node.children && node.children.length > 0) {
        for (let child of node.children) {
            const mappedChild = renderTreeNode(child);
            if (mappedChild) {
                mappedNode.children.push(mappedChild);
            }
        }
    }
    return mappedNode;
}

function displayParseTree() {
    const div = document.getElementById('parseTree');
    if (!div) return;
    if (!parseTree) {
        div.innerHTML = `${explainBlock(
            'Parse Tree',
            'Displays hierarchical derivation produced during reduce actions.',
            'Tree structure makes grammar reductions and expression grouping easy to inspect.'
        )}<p>Parse tree will appear after a successful parse.</p>`;
        return;
    }
    if (typeof d3 === 'undefined') {
        div.innerHTML = '<p>D3.js is not loaded, cannot render tree.</p>';
        return;
    }
    const treeData = renderTreeNode(parseTree);
    const wrapper = document.createElement('div');
    wrapper.className = 'parse-tree-wrapper';
    const width = Math.max(900, div.clientWidth || 900);
    const height = Math.max(500, parserStates.length * 28);
    const svg = d3.create('svg')
        .attr('class', 'parse-tree-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([width - 140, height - 100]);
    treeLayout(root);
    const g = svg.append('g').attr('transform', 'translate(70,50)');
    g.selectAll('.tree-link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'tree-link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );

    const nodes = g.selectAll('.tree-node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'tree-node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle').attr('r', 6);

    nodes.append('text')
        .attr('dy', -10)
        .attr('text-anchor', 'middle')
        .text(d => d.data.name);

    wrapper.appendChild(svg.node());
    div.innerHTML = '';
    div.insertAdjacentHTML('beforeend', explainBlock(
        'Parse Tree',
        'Nodes represent grammar symbols and links represent derivation relationships.',
        'Root at top gives a direct view of how parser reduced tokens into start symbol.'
    ));
    div.appendChild(wrapper);
}

function displayAlgorithmComparison() {
    const div = document.getElementById('algorithmComparison');
    if (!div) return;
    const modes = ['SLR', 'CLR', 'LALR'];

    if (!algorithmComparison || Object.keys(algorithmComparison).length === 0) {
        div.innerHTML = '<p>Comparison data not available.</p>';
        return;
    }

    let html = explainBlock(
        'Algorithm Comparison',
        'Compares SLR, CLR, and LALR by states, table size, and conflict count.',
        'Helps understand tradeoffs between power and memory footprint.'
    );
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>Algorithm</th>';
    html += '<th>States</th>';
    html += '<th>Table Size</th>';
    html += '<th>Memory Score</th>';
    html += '<th>Conflicts</th>';
    html += '<th>Resolved</th>';
    html += '<th>Status</th>';
    html += '</tr></thead><tbody>';

    for (let mode of modes) {
        const data = algorithmComparison[mode];
        if (!data) continue;

        const selectedStyle = mode === parserMode ? ' style="font-weight: 700; background: #eef2ff;"' : '';
        html += `<tr${selectedStyle}>`;
        html += `<td>${mode}</td>`;
        html += `<td>${data.states}</td>`;
        html += `<td>${data.tableSize}</td>`;
        html += `<td>${data.memoryScore}</td>`;
        html += `<td>${data.conflicts}</td>`;
        html += `<td>${data.resolved}</td>`;
        html += `<td>${escapeHtml(data.status)}</td>`;
        html += '</tr>';
    }

    html += '</tbody></table>';
    div.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
