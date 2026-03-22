# Compiler PBL – LR Parser Simulator (SLR / CLR / LALR)

A web-based **LR Parser Simulator** built as a PBL (Project-Based Learning) compiler design project.  
It lets you input a grammar, choose a parser type (**SLR**, **CLR**, or **LALR**), optionally define operator **precedence/associativity**, and then visualizes:

- Augmented grammar
- FIRST and FOLLOW sets
- Canonical item sets (states)
- DFA transitions
- ACTION / GOTO parsing tables
- Parsing steps for an input string
- Parse tree
- Conflict reporting (shift/reduce, reduce/reduce) + resolved conflicts (if applicable)

---

## Features

- **Grammar input** (multi-production format using `|`)
- **Parser modes**:
  - SLR
  - CLR (LR(1))
  - LALR
- **Operator precedence support** (priority + associativity)
- **Tabs/Views**:
  - States
  - DFA
  - Table
  - Steps
  - Parse Tree
  - Conflicts
- **Interactive parsing**: enter an input like `id + id * id` and simulate parsing
- **Visualization** using **D3.js**

---

## Tech Stack

- **HTML / CSS / JavaScript**
- **D3.js (v7)** for visualization

---

## Project Structure

```text
.
├── index.html
├── style.css
└── scripts/
    ├── main.js              # UI events + main analysis pipeline
    ├── globals.js           # shared global state
    ├── grammar.js           # grammar parsing + augmentation helpers
    ├── first-follow.js      # FIRST/FOLLOW computation
    ├── lr0.js               # LR item/state construction utilities
    ├── parsing-table.js     # ACTION/GOTO table generation + conflicts
    ├── parser.js            # parse simulation using generated tables
    └── display.js           # rendering results into UI tabs
```

---

## How to Run (Local)

### Open directly
1. Download/clone the repository
2. Open `index.html` in any modern browser (Chrome/Edge/Firefox)


**VS Code (Live Server extension)**
1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**


## Input Format

### Grammar Format
Write productions like:
```text
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```


## Notes / Limitations

- This is an educational simulator/generator focused on **parsing concepts** (item sets, tables, conflicts, steps).
- Grammar format and tokens are expected in a simplified form (e.g., `id`, operators like `+`, `*`, parentheses).
- Conflicts may appear depending on grammar + chosen parser mode.

---

## Future Improvements (Ideas)

- Support ε (epsilon) explicitly in grammar input
- Export parsing tables as CSV/JSON
- Better parse tree rendering for large inputs
- Add examples library + saved grammars
- Add semantic actions / intermediate code generation (3AC) to extend toward a full compiler pipeline

---

## Team

- Manas joshi 
- Harshit Suyal
- Ashwariy Bisht
- Saumya Pratap Singh
