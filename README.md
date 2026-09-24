<p align="center">
  <a>
    <img alt="Vision Script Logo" src="/assets/logo/Vision.png" width="132" onerror="this.src='https://shields.io'">
  </a>
</p>

<p align="center">
  <a href="https://discord.com/users/thearijiiiitttt_"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="#-setup"><img alt="Node" src="https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white" /></a>
</p>

<p align="center">
  <b>Vision Script Compiler + Simulator</b>: A local-first compiler pipeline and visual robot simulator 📦
</p>

> **Note:** This package contains **only** the Vision Script compiler pipeline (lexer → parser → semantic analysis → IR) extracted from the full robot project. It includes a small CLI that compiles a `.vscript` file and generates a **self-contained HTML file** that visually simulates the robot acting out the compiled program directly in your browser. No server, no hardware, nothing else required.

---

## Table of Contents
1. [Layout](#-layout)
2. [Setup](#-setup)
3. [Run a Script & Get the Simulation](#-run-a-script--get-the-simulation)
4. [Run the Compiler's Own Tests](#-run-the-compilers-own-tests)
5. [Notes & Technical Details](#-notes--technical-details)

<br/>


## Setup

```bash
# Install dependencies
npm install
```

<br/>

## Run a Script & Get the Simulation

```bash
npm run simulate -- test/scripts/demo.vscript
```

This compiles `test/scripts/demo.vscript` and writes `test/output/demo.html`. You can open it in any browser using your OS-specific command:

| Operating System | Command |
| :--- | :--- |
| **macOS** | `open test/output/demo.html` |
| **Linux** | `xdg-open test/output/demo.html` |
| **Windows** | `start test/output/demo.html` |

### What you will see inside the Simulator:
* **Robot Head Visuals:** A big-eyed head animation reacting in real-time.
* **Eye Movements:** Eyes move dynamically as `EYE_SET`, `EYE_LEFT`, `EYE_RIGHT`, or `EYE_CENTER` execute.
* **Body Rotations:** The body turns on screen during `TURN_LEFT` and `TURN_RIGHT`.
* **Animations:** A walking bob effect for `WALK_FORWARD` / `WALK_BACKWARD` and a wiggle animation for `DANCE`.
* **Audio & Logging:** A physical speech bubble pops up for `AUDIO_SPEAK`.
* **Control Panel:** A live instruction log equipped with Play, Pause, Step, Reset buttons, and an execution speed slider. `PRINT` outputs show up directly inside the log panel.

You can point the command at **any script** and choose your own custom output path:
```bash
npm run simulate -- path/to/your.vscript path/to/output.html
```

> ⚠️ **Compilation Safety:** If the script fails to compile, the CLI prints the compiler's native diagnostics (`line:column: severity: message`) and exits non-zero — no HTML is written.

<br/>

## Run the Compiler's Own Tests

```bash
npm test
```
This runs the original unit tests against the extracted compiler (lexer, parser, semantic analyzer, IR generation, loops, variables, IF/RANDOM, etc.) to confirm absolutely nothing was broken while pulling the compiler out of the larger project.

<br/>

## Notes & Technical Details

* **Visual Approximation:** The simulator is built to help you understand script behavior quickly — it is not a real-time hardware physics simulation. Action durations (`WALK_FORWARD 1200`, `TURN_LEFT 600`, etc.) are rendered proportionally rather than physically accurate.
* **Eye Parameters:** `EYE_SET` and `EYE_TRACK_PERSON` take an absolute angle from `0–180` (where `90` is center). `EYE_LEFT` and `EYE_RIGHT` take an optional relative step parameter (defaults to `15°`).
* **Non-Visual Commands:** Commands not interacting directly with the eyes, body