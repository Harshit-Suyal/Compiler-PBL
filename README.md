## PBL Project Details

- **Department:** CSE (Computer Science & Engineering)  
- **Semester:** 6  
- **Project Type:** PBL (Project-Based Learning)  
- **Team Members:**
  - Manas Joshi
  - Harshit Suyal
  - Ashwariy Bisht
  - Saumya Pratap Singh

---

# Compiler PBL – LR Parser Simulator (SLR / CLR / LALR)

## Overview

A web-based **LR Parser Simulator** built as a **Compiler Design PBL project**.  
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
  - CLR 
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

## Explanation (What this simulator does)

This simulator is designed to help understand how LR parsers are constructed and how they parse input strings step-by-step.

You can:
1. **Enter a context-free grammar** (with multiple productions using `|`)
2. **Select LR parser type**
   - **SLR**: uses LR(0) items + FOLLOW sets to place reduce actions  
   - **CLR (LR(1))**: uses LR(1) items with lookaheads for more precise parsing  
   - **LALR**: merges compatible LR(1) states to reduce table size while keeping most CLR power
3. **Generate and view**
   - item sets / states
   - DFA transitions
   - parsing table (ACTION/GOTO)
   - conflicts and (optional) conflict resolution using precedence rules
4. **Simulate parsing**
   - provide an input like `id + id * id`
   - view stack/input/actions at every step
   - view the final parse tree

## Resolving Shift–Reduce Conflicts using Precedence & Associativity

When a grammar is **ambiguous**, the LR parser can produce **shift–reduce conflicts**.

Example ambiguous grammar:

```text
E → E + E | E * E | id
```

This grammar does not specify whether `+` or `*` should be applied first, so during parsing the LR table may face a situation like:

- **SHIFT** (read more input), or
- **REDUCE** (apply a rule now)

To resolve this deterministically, we define **operator precedence** and **associativity**.

---

## Precedence Format

Write each operator rule in this format:

```text
<operator> <precedence_level> <left|right|none>
```

### Example

```text
+ 1 left
* 2 left
```

---

## What Each Part Means

### 1) Operator
The symbol used in your grammar, such as:

- `+`, `*`, `-`, `/`

### 2) Precedence Level
A number that defines priority:

- **Higher number = higher precedence**
- **Lower number = lower precedence**

So in this example:

- `*` has precedence `2`
- `+` has precedence `1`

That means:

- `*` binds tighter than `+`
- Multiplication happens before addition

### 3) Associativity
Defines what happens when **operators of the same precedence** appear together.

| Associativity | Meaning | Example idea |
|---|---|---|
| `left`  | Evaluate left to right  | `id - id - id` → `(id - id) - id` |
| `right` | Evaluate right to left | `id ^ id ^ id` → `id ^ (id ^ id)` |
| `none`  | No chaining allowed | `id < id < id` is invalid |

---

## How Conflict Resolution Works (Logic)

A shift–reduce conflict happens when the parser can either:

- **SHIFT** the next input symbol (keep reading), or
- **REDUCE** using a production rule (apply a grammar rule now)

To decide, compare:

1. **Input operator**  
   The operator coming next in the input (lookahead).

2. **Production operator**  
   The operator involved in the reduction rule being considered.

---

## Conflict Resolution Rules

### Rule 1: Higher precedence → SHIFT 
If:

```text
precedence(input operator) > precedence(production operator)
```

Then:

- **SHIFT** (because the incoming operator should bind first)

**Example**
```text
+ 1 left
* 2 left
```

If the parser is deciding between reducing `E + E` or shifting `*`:

- input operator = `*` (precedence 2)
- production operator = `+` (precedence 1)

Since `2 > 1` → **SHIFT**

This enforces: multiplication before addition.

---

### Rule 2: Lower precedence → REDUCE 
If:

```text
precedence(input operator) < precedence(production operator)
```

Then:

- **REDUCE** (because the current operator should finish first)

---

### Rule 3: Same precedence → Use associativity 
If:

```text
precedence(input operator) == precedence(production operator)
```

Then check associativity of that operator:

- **left associativity** → **REDUCE**
- **right associativity** → **SHIFT**
- **none** → **ERROR**

Why?

- **left associative** means group from the left, so reduce earlier.
- **right associative** means group from the right, so shift more first.
- **none** means the parser should not accept chaining at that precedence.

---

## Full Example (Easy + Clear)

### Grammar
```text
E → E + E | E * E | id
```

### Precedence Rules
```text
+ 1 left
* 2 left
```

### Input
```text
id + id * id
```

### What Should Happen (Intuition)
- `*` has higher precedence than `+`
- so the expression should parse like:

```text
id + (id * id)
```

### What the Parser Does During the Conflict
At some point, the parser has something equivalent to:

- already seen: `id + id`
- next input: `* id`

Now it must choose:

- **REDUCE** using `E → E + E`  
  (which would force `(id + id) * id`, which is wrong by precedence)

OR

- **SHIFT** the `*`  
  (so it can form `id * id` first)

Using Rule 1:

- input operator `*` has precedence 2  
- production operator `+` has precedence 1  
- `2 > 1` ⇒ **SHIFT**

So the parser shifts `*`, builds `id * id`, reduces that, and only then reduces the `+`.

Result:

```text
id + (id * id)
```

---
