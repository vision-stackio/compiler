#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { dirname, resolve, join, basename } from "path";
import { Compiler } from "../compiler/Compiler";
import { formatDiagnostics } from "../compiler/diagnostics";
import { downloadSong } from "../src/music_responce";
import type { Instruction } from "../compiler/ir/IR";

function usage(): never {
  console.error(
    "Usage: npm run simulate -- <script.vscript> [output.html]\n" +
      "  script.vscript   Vision Script source file to compile\n" +
      "  output.html      Where to write the simulation (default: test/output/<name>.html)\n\n" +
      "PLAY_MUSIC / PLAY_SONG_REQUEST with a song name will download audio via yt-dlp\n" +
      "(YouTube, not Jamendo) into a music/ folder next to the HTML output."
  );
  process.exit(1);
}

const MUSIC_COMMANDS = new Set(["PLAY_MUSIC", "PLAY_SONG_REQUEST"]);

function isUrl(s: string): boolean {
  return /^(https?:|blob:|data:)/i.test(s);
}

async function resolveMusicInstructions(instructions: Instruction[], musicDir: string): Promise<Instruction[]> {
  const cache = new Map<string, string>(); // song query -> relative path for HTML

  const out: Instruction[] = [];
  for (const instr of instructions) {
    if (instr.op !== "EXEC" || !MUSIC_COMMANDS.has(instr.command) || typeof instr.arg !== "string") {
      out.push(instr);
      continue;
    }

    const song = instr.arg.trim();
    if (!song || isUrl(song) || /\.(m4a|webm|mp3|opus|ogg)(\?|$)/i.test(song)) {
      out.push(instr);
      continue;
    }

    if (cache.has(song)) {
      out.push({ ...instr, arg: cache.get(song)! });
      continue;
    }

    console.log(`\n[music] Downloading "${song}" via YouTube (yt-dlp, no Jamendo)...`);
    try {
      const result = await downloadSong(song, musicDir);
      // Path relative to the HTML file (sibling music/ folder)
      const rel = `./music/${encodeURIComponent(result.fileName)}`;
      cache.set(song, rel);
      console.log(`[music] Ready: ${result.fileName}`);
      out.push({ ...instr, arg: rel });
    } catch (err: any) {
      console.error(`[music] Failed to download "${song}":`, err?.message || err);
      // Keep original string so simulator still shows the caption
      out.push(instr);
    }
  }
  return out;
}

async function main() {
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

  const templatePath = resolve(__dirname, "../assets/simulator.html");
  if (outputPath === templatePath) {
    console.error(
      `Refusing to write output on top of the template: ${templatePath}\n` +
        `Leave the output argument empty or choose a different path.`
    );
    process.exit(1);
  }

  const outDir = dirname(outputPath);
  const musicDir = join(outDir, "music");
  mkdirSync(musicDir, { recursive: true });

  const instructions = await resolveMusicInstructions(result.ir.instructions, musicDir);

  const template = readFileSync(templatePath, "utf8");
  const payload = JSON.stringify({
    sourceName: inputArg,
    source,
    instructions,
  });

  const html = template.replace(
    "/*__VISION_PROGRAM__*/",
    `window.__VISION_PROGRAM__ = ${payload};`
  );

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outputPath, html, "utf8");

  console.log(`\nCompiled ${instructions.length} instruction(s) from ${inputArg}`);
  console.log(`Simulation written to ${outputPath}`);
  console.log(`Music files (if any) in ${musicDir}`);
  console.log(`Open in a browser, e.g.:\n  start ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
