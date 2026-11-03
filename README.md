# Turing Studio

**Turing Studio** is an educational, deterministic single-tape Turing Machine development environment and interactive simulator. It bridges the gap between natural-language problem descriptions and formal computational theory without ever executing arbitrary LLM-generated code.

---

## 🌟 Key Features

1. **Deterministic Turing Machine Runtime (DTM Engine)**:
   - Truly unbounded, two-way infinite sparse tape (`dict[int, str]`).
   - Supports arbitrary negative and positive indices without boundary crashes.
   - Deterministic transition function $\delta(q, a) \to (q', b, D)$ where $D \in \{L, R, S\}$.
   - Explicit halting outcomes: `ACCEPT`, `REJECT`, `HALTED_UNDEFINED_TRANSITION`, and `TIMEOUT`.
   - Immutable trace recording, full step undo / step back, and cycle detection.

2. **Interactive SVG Tape Visualization**:
   - Scalable SVG rendering of tape cells with index numbers and symbols.
   - Moving animated read/write head pointing to the active cell.
   - Panning (drag or arrow buttons), zooming, and "Center on Head" controls.
   - Active span / non-blank cell bounding indicators.
   - Accessibility toggle for reduced motion.

3. **Natural-Language Machine Compiler**:
   - Synthesizes formal Turing Machine Intermediate Representation (IR) JSON from plain English descriptions.
   - Detects ambiguity or underspecified languages and requests concise clarifications instead of guessing.
   - Automated validator-guided repair loop: tests generated IR against the validator and automatically repairs schema/semantic issues before presenting to the user.
   - Pluggable provider architecture:
     - **Built-in Synthesizer**: Instant, offline deterministic compiler for classic machines.
     - **Ollama**: Connects to local models (e.g. `llama3`, `mistral`, `qwen2.5`) on `http://localhost:11434`.
     - **Hosted API**: OpenAI-compatible endpoint (OpenAI, Gemini proxy, Groq).

4. **Machine Specification & Transition Table Editor**:
   - Live editable formal definition: States $Q$, Input alphabet $\Sigma$, Tape alphabet $\Gamma$, Blank symbol, Start state $q_0$, Accept states $F$, Reject states.
   - Interactive transition table with state filtering, inline row editing, add new transition, and delete.
   - Deep semantic validation: checks for unreachable states, undeclared states/symbols, determinism conflicts, and halting state transitions.
   - Specification JSON import and export.

5. **Playback Controls & Trace Inspector**:
   - Controls: **Step**, **Step Back (Undo)**, **Play / Pause**, **Run to End**, and **Reset**.
   - Adjustable speed: Slow (800ms), Normal (300ms), Fast (80ms), Turbo (10ms).
   - Trace history log with click-to-inspect historical configurations.
   - State breakpoint manager: pause execution whenever a designated state is reached.
   - Keyboard shortcuts: `Space` (Play/Pause), `→` (Step), `←` (Back), `R` (Reset).

6. **Pre-Loaded Classic Educational Machines**:
   - **Even Number of Ones**: Binary language recognition ($L = \{w \in \{0,1\}^* \mid |w|_1 \text{ is even}\}$).
   - **Binary Palindrome Recognizer**: Iterative two-way boundary matching.
   - **Binary Incrementer (+1)**: Scans right to LSB, adds 1 with leftward carry.
   - **Unary Incrementer (+1)**: Appends a 1 to a unary sequence.
   - **Binary Bit Inverter**: Inverts each bit ($0 \to 1, 1 \to 0$).

7. **Project Storage**:
   - Local-first persistence via SQLite (`aiosqlite`) and browser `localStorage`.
   - Save and reopen machine projects with input strings and traces.

---

## 🚀 Quick Start

### Option A: One-Click Launchers (Windows)
Double-click:
- **`run_all.bat`**: Launches both the Python FastAPI backend and the React frontend in parallel.
- Or run **`run_backend.bat`** and **`run_frontend.bat`** individually.

### Option B: Manual Terminal Execution

#### 1. Backend (FastAPI + Python 3.13)
```bash
cd backend
# Virtual environment is already configured at backend/.venv
.\.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

#### 2. Frontend (React + Vite + TypeScript)
```bash
cd apps/desktop
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run the comprehensive unit test suite:
```bash
cd backend
.\.venv\Scripts\pytest -v
```
All 28 tests cover:
- Sparse unbounded tape operations (positive/negative indices, reading blank, memory pruning).
- Schema and semantic validator rules (duplicate states, missing start/halt states, alphabet subsets, determinism).
- Simulation acceptance scenarios (Even 1s, Palindrome, Binary Incrementer, Unary Incrementer).
- Step back and configuration restoration.
- Undefined transition halting and step limit timeout.
- NL compiler service and mock provider clarification scenarios.
- End-to-end FastAPI endpoint lifecycle.
