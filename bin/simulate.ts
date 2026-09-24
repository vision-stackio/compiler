#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { Compiler } from "../compiler/Compiler";
import { formatDiagnostics } from "../compiler/diagnostics";

function usage(): never {
  console.error(
    "Usage: npm run simulate -- <script.vscript> [output.html]\n" +
      "  script.vscript   Vision Script source file to compile\n" +
      "  output.html      Where to write the simulation (default: test/output/<name>.html)"
  );
  process.exit(1);
}

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) usage();

const inputPath = resolve(process.cwd(), inputArg);
if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const source = readFileSync(inputPath, "utf8");
const result = new Compiler().compile(source);

if (!result.success || !result.ir) {
  console.error(`Compilation failed for ${inputArg}:\n`);
  console.error(formatDiagnostics(result.diagnostics, source));
  process.exit(1);
}

if (result.diagnostics.length > 0) {
  console.warn(formatDiagnostics(result.diagnostics, source));
}

const baseName = inputArg.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "") || "program";
const outputPath = resolve(process.cwd(), outputArg || `test/output/${baseName}.html`);

const template = readFileSync(resolve(__dirname, "../assets/simulator.html"), "utf8");
const payload = JSON.stringify({
  sourceName: inputArg,
  source,
  instructions: result.ir.instructions,
});

const html = template.replace(
  "/*__VISION_PROGRAM__*/",
  `window.__VISION_PROGRAM__ = ${payload};`
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html, "utf8");

console.log(`Compiled ${result.ir.instructions.length} instruction(s) from ${inputArg}`);
console.log(`Simulation written to ${outputPath}`);
console.log(`Open it directly in a browser, e.g.:\n  open ${outputPath}   (macOS)\n  xdg-open ${outputPath}   (Linux)`);
