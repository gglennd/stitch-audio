#!/usr/bin/env node
/* eslint-disable node/prefer-global/process */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".ogg",
  ".aac",
  ".m4a",
  ".wma",
  ".opus",
]);

interface Options {
  input: string;
  output: string;
  gap: number;
}

function showHelp(): void {
  console.log(`
Usage: stitch-audio [input] [output] [options]

Arguments:
  input                  Input directory (default: "audios")
  output                 Output MP3 file (default: "output.mp3")

Options:
  -g, --gap <ms>        Gap between tracks in milliseconds (default: 400)
  -h, --help            Show this help
`);
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = { input: "audios", output: "output.mp3", gap: 400 };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined)
      break;

    if (arg === "-h" || arg === "--help") {
      showHelp();
      process.exit(0);
    }

    if (arg === "-g" || arg === "--gap") {
      const val = args[++i];
      if (val === undefined)
        break;
      const gap = Number.parseInt(val, 10);
      if (Number.isNaN(gap) || gap < 0) {
        console.error("Gap must be a non-negative integer (milliseconds)");
        process.exit(1);
      }
      opts.gap = gap;
      continue;
    }

    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }

    if (opts.input === "audios") {
      opts.input = arg;
    }
    else if (opts.output === "output.mp3") {
      opts.output = arg;
    }
  }

  return opts;
}

function checkFfmpeg(): void {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  }
  catch {
    console.error(
      "ffmpeg is not installed or not found in PATH. "
      + "Install it via: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)",
    );
    process.exit(1);
  }
}

function getAudioFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter(e => e.isFile() && AUDIO_EXTENSIONS.has(extname(e.name).toLowerCase()))
    .sort((a, b) => {
      const na = Number.parseInt(a.name.match(/^(\d+)/)?.[1] ?? "0", 10);
      const nb = Number.parseInt(b.name.match(/^(\d+)/)?.[1] ?? "0", 10);
      return na - nb;
    })
    .map(e => join(dir, e.name));
  return files;
}

function stitch(files: string[], output: string, gapMs: number): void {
  const inputs = files.map(f => `-i "${f}"`).join(" ");

  const labels: string[] = [];
  const pads: string[] = [];
  for (let i = 0; i < files.length; i++) {
    if (i < files.length - 1) {
      pads.push(`[${i}:a]apad=pad_dur=${gapMs}ms[s${i}]`);
      labels.push(`[s${i}]`);
    }
    else {
      labels.push(`[${i}:a]`);
    }
  }

  const filterComplex = [...pads, `${labels.join("")}concat=n=${files.length}:v=0:a=1[out]`].join(";");

  execSync(
    `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[out]" "${output}"`,
    { stdio: "inherit" },
  );
}

function main(): void {
  checkFfmpeg();

  const opts = parseArgs();

  const inputDir = resolve(opts.input);
  if (!existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }
  if (!statSync(inputDir).isDirectory()) {
    console.error(`Input path is not a directory: ${inputDir}`);
    process.exit(1);
  }

  const files = getAudioFiles(inputDir);
  if (files.length === 0) {
    console.error(`No audio files found in ${inputDir}`);
    process.exit(1);
  }

  const outputPath = resolve(opts.output);
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`Found ${files.length} audio files`);
  for (const f of files) {
    console.log(`  ${relative(process.cwd(), f)}`);
  }
  console.log(`Stitching to ${outputPath} with ${opts.gap}ms gap...`);
  stitch(files, outputPath, opts.gap);
  console.log("Done!");
}

main();
