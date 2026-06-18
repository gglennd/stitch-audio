# stitch-audio

CLI tool to stitch audio files into a single MP3 using ffmpeg.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [ffmpeg](https://ffmpeg.org/) installed and available in PATH

## Installation

```sh
npm install -g stitch-audio
```

Or run directly:

```sh
npx stitch-audio
```

## Usage

```sh
stitch-audio [input] [output] [options]
```

- `input` — directory containing audio files (default: `audios`)
- `output` — output MP3 file path (default: `output.mp3`)

### Options

| Flag | Description |
|------|-------------|
| `-g, --gap <ms>` | Gap between tracks in milliseconds (default: `400`) |
| `-h, --help` | Show help |

### Supported formats

mp3, wav, flac, ogg, aac, m4a, wma, opus

### Sorting

Files are sorted by numeric prefix — e.g. `01_Chapter 1.mp3`, `02_Chapter 1.mp3`, etc.

### Examples

```sh
# default gap (400ms)
stitch-audio my-audios combined.mp3

# custom gap
stitch-audio my-audios combined.mp3 --gap 200
```
