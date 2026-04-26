# Compiler PBL - LR Parser Simulator (SLR / CLR / LALR)

A web-based LR parser simulator developed as a Compiler Design Project-Based Learning (PBL) project.

## PBL Project Details

- Department: CSE (Computer Science and Engineering)
- Semester: 6
- Project Type: PBL (Project-Based Learning)
- Team Members:
  - Manas Joshi
  - Harshit Suyal
  - Ashwariy Bisht
  - Saumya Pratap Singh

## Project Overview

This simulator helps students understand how LR-family parsers are built and used in practice.

You can provide a context-free grammar, select parser mode (SLR, CLR, or LALR), optionally add operator precedence and associativity rules, and inspect every major artifact generated during parser construction and simulation.

The app visualizes:

- Augmented grammar
- FIRST and FOLLOW sets
- Canonical item sets (states)
- DFA transitions between states
- ACTION and GOTO parsing tables
- Step-by-step parsing trace for an input string
- Parse tree
- Conflict report:
  - shift/reduce
  - reduce/reduce
  - conflicts resolved via precedence (when applicable)

## Features

- Grammar input with multi-production format using `|`
- Parser modes:
  - SLR
  - CLR (LR(1))
  - LALR
- Operator precedence and associativity support
- Tab-based visual output:
  - States
  - DFA
  - Table
  - Steps
  - Parse Tree
  - Conflicts
- Interactive parse simulation (for example: `id + id * id`)
- Save parsing runs to browser local storage (valid, conflict-free grammar only)
- Export full parsing report to `.txt` (valid, conflict-free grammar only)
- D3.js-based DFA visualization
- Built-in grammar examples with one-click cycling
- Light and dark theme toggle

## Tech Stack

- HTML
- CSS
- JavaScript (vanilla)
- D3.js v7 (for DFA rendering)

## Project Structure

```text
.
|-- index.html
|-- style.css
`-- scripts/
    |-- main.js              # UI events + analysis pipeline
    |-- globals.js           # shared global state
    |-- grammar.js           # grammar parsing + augmentation helpers
    |-- first-follow.js      # FIRST/FOLLOW computation
    |-- lr0.js               # LR item/state construction utilities
    |-- parsing-table.js     # ACTION/GOTO table generation + conflicts
    |-- parser.js            # parse simulation + save/export snapshot logic
    `-- display.js           # rendering into UI tabs
```

## How to Run

No build tools are required.

1. Clone/download this project.
2. Open the project folder in VS Code (or any editor).
3. Open `index.html` in a browser.

Optional local server method (recommended in some browsers):

- Use VS Code Live Server extension, or
- Run a simple local static server and open the served URL.

## How to Use the Simulator

1. Enter grammar in the Grammar box.
2. Select parser type: `SLR`, `CLR`, or `LALR`.
3. (Optional) Enter precedence rules.
4. Click Analyze Grammar.
5. Inspect generated output in tabs:
   - States
   - DFA
   - Table
   - Conflicts
6. Go to Steps tab and enter input string to parse.
7. Click Parse Input to see parsing trace and parse tree.
8. Optionally:
   - Save Steps: stores full run in browser local storage.
   - Export Steps: downloads full run as a text file.

## Grammar Input Format

Each production must use `->`.

Alternatives can be written using `|`.

Example:

```text
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

Input notes:

- LHS non-terminals must be uppercase-style symbols (example: `E`, `T`, `S`, `E'`).
- Tokens are whitespace-aware; common terminals like `id`, operators, and parentheses are supported.
- Epsilon symbol is `ε`.

## Precedence and Associativity Format

Write one operator rule per line:

```text
<operator> <precedence_level> <left|right|none>
```

Example:

```text
+ 1 left
* 2 left
```

Interpretation:

- Higher number means higher precedence.
- `left` means left-associative.
- `right` means right-associative.
- `none` means no associative chaining.

## Parser Modes (Implemented)

- SLR:
  - Uses LR(0) item cores
  - Uses FOLLOW sets for reduce placement
- CLR (LR(1)):
  - Uses LR(1) items with explicit lookaheads
- LALR:
  - Builds LR(1) states then merges compatible states to reduce table size

## Conflict Handling Logic

The simulator detects parsing-table conflicts while constructing ACTION/GOTO entries.

If a shift/reduce conflict occurs and precedence metadata exists, conflict resolution follows:

1. If precedence(input operator) > precedence(production operator): choose SHIFT
2. If precedence(input operator) < precedence(production operator): choose REDUCE
3. If equal precedence:
   - left associativity -> REDUCE
   - right associativity -> SHIFT
   - none -> unresolved conflict

Reduce/reduce conflicts remain reported as conflicts.

## Example: Ambiguous Expression Grammar

Grammar:

```text
E -> E + E | E * E | id
```

Precedence:

```text
+ 1 left
* 2 left
```

Input:

```text
id + id * id
```

Expected parse intention:

```text
id + (id * id)
```

At the key conflict point, parser compares incoming `*` with reduction over `+`:

- precedence(`*`) = 2
- precedence(`+`) = 1
- 2 > 1, so SHIFT is selected

This enforces multiplication before addition.

## Output Views Explained

- States:
  - Augmented grammar
  - FIRST/FOLLOW
  - Canonical item sets
- DFA:
  - State transition graph + transition list
- Table:
  - ACTION and GOTO tables
  - Cross-mode algorithm comparison block
- Steps:
  - Stack/input/action trace at each parser step
- Parse Tree:
  - Tree generated from reductions during successful parse
- Conflicts:
  - Unresolved conflicts
  - Resolved conflicts with reason

## Validation and Error Handling

The app validates:

- Empty grammar
- Invalid production arrow format
- Invalid non-terminal forms on LHS
- Undefined non-terminals used in productions
- Invalid precedence rule syntax
- Invalid precedence level/associativity values

Runtime parse errors are shown in Steps/status outputs.

## Limitations

- Client-side simulator intended for learning and demonstration.
- No backend persistence (except browser local storage for saved runs).
- Save/export is restricted to valid conflict-free grammar configurations.
- Very large grammars may reduce UI responsiveness in browser.

## Learning Goals Covered

This project demonstrates practical understanding of:

- Grammar augmentation
- FIRST/FOLLOW computation
- LR item closure and goto construction
- SLR vs CLR vs LALR trade-offs
- Parsing table construction
- Conflict detection and precedence-based resolution
- Stack-based LR parsing simulation

## Future Enhancements

- Better diagnostics for invalid token streams
- Import/export grammar presets
- More graph layout options for large DFA sets
- Better parse tree interaction (zoom, collapse, search)
- Test suite for grammar and parsing modules


