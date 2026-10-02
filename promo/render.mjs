import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, 'maya-bridal-shower-reel.mp4');
const working = await mkdtemp(join(tmpdir(), 'maya-bridal-promo-'));
const origin = process.env.PROMO_ORIGIN || 'http://127.0.0.1:5173';
const bpm = 112;
const beat = 60 / bpm;
const videoDuration = 44 * beat;
const outputDuration = videoDuration + .18;
const sampleRate = 48000;

function writeOriginalTrack(filePath) {
  const sampleCount = Math.ceil(sampleRate * videoDuration);
  const left = new Float32Array(sampleCount);
  const right = new Float32Array(sampleCount);
  const frequency = (midi) => 440 * (2 ** ((midi - 69) / 12));
  const addSample = (index, value, pan = .5) => {
    const leftPan = Math.cos(pan * Math.PI / 2);
    const rightPan = Math.sin(pan * Math.PI / 2);
    left[index] += value * leftPan;
    right[index] += value * rightPan;
  };

  const addTone = (midi, start, duration, volume, kind = 'lead', pan = .5) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(sampleCount, Math.ceil((start + duration) * sampleRate));
    const base = frequency(midi);
    const attack = kind === 'pad' ? .75 : kind === 'bass' ? .012 : .018;
    const release = kind === 'pad' ? .8 : kind === 'bass' ? .13 : Math.min(.42, duration * .72);
    for (let index = from; index < to; index += 1) {
      const elapsed = index / sampleRate - start;
      const phase = 2 * Math.PI * base * elapsed;
      const fadeIn = Math.min(1, Math.max(0, elapsed / attack));
      const fadeOut = Math.min(1, Math.max(0, (duration - elapsed) / release));
      let wave = Math.sin(phase);
      if (kind === 'lead') wave += .24 * Math.sin(phase * 2.006) + .075 * Math.sin(phase * 3);
      if (kind === 'bass') wave += .14 * Math.sin(phase * 2);
      if (kind === 'pad') wave += .13 * Math.sin(phase * 2);
      const endFade = Math.min(1, Math.max(0, (videoDuration - index / sampleRate) / .72));
      addSample(index, wave * fadeIn * fadeOut * volume * endFade, pan);
    }
  };

  const addKick = (start, strength) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(sampleCount, from + Math.ceil(.23 * sampleRate));
    for (let index = from; index < to; index += 1) {
      const elapsed = index / sampleRate - start;
      const phase = 2 * Math.PI * (47 * elapsed + (112 / 28) * (1 - Math.exp(-28 * elapsed)));
      const sub = Math.sin(phase) * Math.exp(-elapsed * 20);
      const click = .24 * Math.sin(2 * Math.PI * 188 * elapsed) * Math.exp(-elapsed * 95);
      addSample((index), (sub + click) * strength, .5);
    }
  };

  let randomSeed = 74129;
  const random = () => {
    randomSeed ^= randomSeed << 13;
    randomSeed ^= randomSeed >>> 17;
    randomSeed ^= randomSeed << 5;
    return (randomSeed >>> 0) / 0xffffffff * 2 - 1;
  };
  const addClap = (start, strength) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(sampleCount, from + Math.ceil(.2 * sampleRate));
    for (let index = from; index < to; index += 1) {
      const elapsed = index / sampleRate - start;
      const envelope = Math.exp(-elapsed * 30) * (elapsed < .035 ? .68 : 1);
      const snap = Math.sin(2 * Math.PI * 1650 * elapsed) * Math.exp(-elapsed * 45) * .16;
      addSample(index, (random() * .56 + snap) * envelope * strength, .48 + .12 * Math.sin(elapsed * 9));
    }
  };
  const addHat = (start, strength) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(sampleCount, from + Math.ceil(.045 * sampleRate));
    for (let index = from; index < to; index += 1) {
      const elapsed = index / sampleRate - start;
      const tint = Math.sin(2 * Math.PI * 7800 * elapsed) * .23;
      addSample((index), (random() * .76 + tint) * Math.exp(-elapsed * 125) * strength, .38 + .24 * (index % 2));
    }
  };
  const addSweep = (start, duration, strength) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(sampleCount, Math.ceil((start + duration) * sampleRate));
    for (let index = from; index < to; index += 1) {
      const elapsed = index / sampleRate - start;
      const progress = elapsed / duration;
      const swell = Math.sin(Math.PI * progress / 2) ** 2;
      const rise = Math.sin(2 * Math.PI * (430 * elapsed + 3400 * elapsed * elapsed));
      addSample(index, (random() * .36 + rise * .25) * swell * strength, .36 + .28 * progress);
    }
  };

  // Bright, percussive opening motif; original notes and synthesized percussion only.
  addKick(0, .9);
  addClap(.015, .44);
  [[74, .035], [78, .29], [81, .55], [78, .82]].forEach(([midi, at], index) => addTone(midi, at, .42, .105, 'lead', .34 + index * .1));

  const sections = [
    { beatAt: 0, root: 38, chord: [62, 66, 69, 76] },
    { beatAt: 8, root: 33, chord: [64, 69, 71, 76] },
    { beatAt: 16, root: 35, chord: [62, 66, 71, 74] },
    { beatAt: 24, root: 31, chord: [62, 67, 71, 76] },
    { beatAt: 32, root: 38, chord: [62, 66, 69, 76] },
    { beatAt: 40, root: 33, chord: [64, 69, 71, 76] },
  ];

  sections.forEach(({ beatAt, root, chord }) => {
    const start = beatAt * beat;
    const sectionLength = Math.min(8 * beat + .24, videoDuration - start);
    chord.slice(0, 3).forEach((midi, index) => addTone(midi, start, sectionLength, .018, 'pad', .34 + index * .16));
    // A syncopated, bell-like two-bar motif gives each section a fresh lift.
    const motif = [3, 1, 2, 1, 3, 2, 0, 2, 3, 1, 2, 1, 4, 2, 3, 1];
    motif.forEach((noteIndex, step) => {
      const at = start + step * beat / 2;
      const note = chord[noteIndex % chord.length] + 12;
      const velocity = step % 4 === 0 ? .078 : .055;
      addTone(note, at, .22, velocity, 'lead', .3 + (step % 5) * .09);
    });
    [0, 2, 4, 6].forEach((offset) => {
      const at = start + offset * beat;
      addTone(root, at, .34, offset % 4 === 0 ? .16 : .12, 'bass', .5);
      addTone(chord[1], at + beat * .5, .2, .04, 'lead', .62);
    });
  });

  for (let beatIndex = 0; beatIndex < 44; beatIndex += 1) {
    const at = beatIndex * beat;
    const position = beatIndex % 4;
    addKick(at, position === 0 ? .66 : position === 2 ? .48 : .2);
    if (position === 1 || position === 3) addClap(at, position === 3 ? .58 : .48);
    addHat(at + .01, position === 0 ? .055 : .038);
    addHat(at + beat * .5, .032);
  }

  [4, 9, 16, 20, 28, 36].forEach((beatAt) => addSweep(beatAt * beat - .18, .2, .11));

  let peak = .001;
  for (let index = 0; index < sampleCount; index += 1) {
    peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
  }
  const gain = .72 / peak;
  const buffer = Buffer.alloc(44 + sampleCount * 4);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 4, 28); buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(sampleCount * 4, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const softClip = (sample) => Math.tanh(sample * gain * 1.25) / Math.tanh(1.25);
    buffer.writeInt16LE(Math.round(softClip(left[index]) * 32767), 44 + index * 4);
    buffer.writeInt16LE(Math.round(softClip(right[index]) * 32767), 46 + index * 4);
  }
  return writeFile(filePath, buffer);
}

const audioPath = join(working, 'original-upbeat-score.wav');
await writeOriginalTrack(audioPath);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: working, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
page.on('pageerror', (error) => process.stderr.write(`Promo page error: ${error.message}\n`));
await page.goto(`${origin}/promo.html?render=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(outputDuration * 1000 + 180);
const video = page.video();
await context.close();
await browser.close();
const rawVideo = await video.path();

const ffmpeg = spawnSync(ffmpegPath, [
  '-y', '-i', rawVideo, '-i', audioPath,
  '-t', outputDuration.toFixed(3), '-map', '0:v:0', '-map', '1:a:0',
  '-vf', 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p',
  '-af', 'loudnorm=I=-17:TP=-1.5:LRA=8',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-profile:v', 'high', '-level:v', '4.1',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', output,
], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
if (ffmpeg.status !== 0) {
  process.stderr.write(ffmpeg.stderr || ffmpeg.error?.message || 'FFmpeg failed.');
  process.exit(ffmpeg.status || 1);
}

const size = (await readFile(output)).length;
await rm(working, { recursive: true, force: true });
process.stdout.write(`Created ${output}\n1080 × 1920 · 30 fps · ${outputDuration.toFixed(2)} sec · ${bpm} BPM · ${(size / 1024 / 1024).toFixed(1)} MB\n`);
