# Vision Script Compiler + Simulator

This package contains **only** the Vision Script compiler pipeline
(lexer → parser → semantic analysis → IR) extracted from the full robot
project, plus a small CLI that compiles a `.vscript` file and generates a
**self-contained HTML file** that visually simulates the robot (the
big-eyed head shown in your reference image) acting out the compiled
program in the browser — no server, no hardware, nothing else required.

## Layout

```
compiler/          The compiler itself (lexer/parser/ast/semantic/ir), untouched.
packages/types.ts   The one external file the compiler depends on (CommandType list).
bin/simulate.ts      CLI: source file -> compiles -> writes HTML simulation.
assets/simulator.html  HTML/CSS/JS template the CLI fills in with the compiled IR.
test/scripts/        Example .vscript programs to try.
test/output/          Where generated simulation HTML files land (git-ignored in spirit).
test/unit/            The original compiler unit tests (vitest), unmodified logic.
```

## Setup

```bash
npm install
```

## Run a script and get the simulation

```bash
npm run simulate -- test/scripts/demo.vscript
```

This compiles `test/scripts/demo.vscript` and writes
`test/output/demo.html`. Open it in any browser:

```bash
open test/output/demo.html        # macOS
xdg-open test/output/demo.html    # Linux
start test/output/demo.html       # Windows
```

You'll see the robot head with its two eyes moving as `EYE_SET` /
`EYE_LEFT` / `EYE_RIGHT` / `EYE_CENTER` execute, the body turning for
`TURN_LEFT` / `TURN_RIGHT`, a walking bob for `WALK_FORWARD` /
`WALK_BACKWARD`, a dance wiggle for `DANCE`, a speech bubble for
`AUDIO_SPEAK`, and a live instruction log with Play / Pause / Step /
Reset and a speed slider. `PRINT` output shows up in the log panel too.

You can point the command at any script and choose the output path:

```bash
npm run simulate -- path/to/your.vscript path/to/output.html
```

If the script fails to compile, the CLI prints the compiler's
diagnostics (`line:column: severity: message`) and exits non-zero — no
HTML is written.

## Run the compiler's own tests

```bash
npm test
```

Runs the original unit tests against the extracted compiler (lexer,
parser, semantic analyzer, IR generation, loops, variables, IF/RANDOM,
etc.) to confirm nothing was broken while pulling the compiler out of
the larger project.

## Notes

- The simulator is a visual approximation for understanding script
  behavior — it is not the real hardware simulation, and durations
  (`WALK_FORWARD 1200`, `TURN_LEFT 600`, etc.) are shown proportionally,
  not physically accurate.
- `EYE_SET`/`EYE_TRACK_PERSON` take an absolute angle 0–180 (90 = center);
  `EYE_LEFT`/`EYE_RIGHT` take an optional relative step (default 15°).
- Everything not touching the eyes/body/speech (camera, audio-listening,
  memory, tasks, etc.) is accepted by the compiler but has no visual
  effect in the simulator — it just appears in the instruction log.
