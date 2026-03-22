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

--- in this readme explain that 
