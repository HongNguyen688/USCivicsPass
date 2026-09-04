#!/usr/bin/env node
/**
 * Pre-render every spoken line in the app into real neural-voice audio.
 *
 * Why this exists: the device's built-in synthesizer (Web Speech on the web,
 * AVSpeechSynthesizer/Android TTS in the native shell) sounds unmistakably
 * synthetic on any device without an Enhanced/Premium voice downloaded, and no
 * amount of voice-picking in the app can fix that — those are the only voices
 * there are.
 *
 * All the app's spoken content is fixed, so it is rendered once, here, with
 * Kokoro (an 82M-parameter neural TTS that runs locally — no API key, no
 * per-play cost) and shipped as audio files. The app plays them and falls back
 * to live TTS for anything missing, so a half-generated set still works.
 *
 * Two sets are produced:
 *
 *   public/audio/interview/  the Mock Interview, cast as two speakers, indexed
 *                            by section and turn (src/data/interviewAudio.json)
 *   public/audio/speech/     everything else — civics questions and answers,
 *                            vocabulary, reading and writing sentences, N-400
 *                            cards — all in one voice, looked up by the exact
 *                            text spoken (src/data/speechAudio.json)
 *
 * Usage:
 *   node scripts/generate-audio.mjs                # only what changed
 *   node scripts/generate-audio.mjs --force        # re-render everything
 *   node scripts/generate-audio.mjs --only=speech  # or --only=interview
 *
 * The first run downloads the model (~330MB at fp32) into the Hugging Face
 * cache; later runs are offline. KOKORO_DTYPE=q8 downloads ~86MB instead and
 * renders faster, at some cost in quality.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { KokoroTTS } from 'kokoro-js';

import { parseDialogue } from '../src/utils/parseDialogue.js';
import { formatSmartAnswer } from '../src/utils/formatSmartAnswer.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/data');
const load = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));

// The cast. Kokoro's voices are graded in its README; af_heart is its best-rated
// voice and reads everything in the app. The Mock Interview's officer is the one
// exception — he needs to be audibly a different person from the applicant.
const APP_VOICE = 'af_heart';         // female, grade A — the app's voice
const OFFICER_VOICE = 'am_michael';   // male, grade B — Mock Interview officer only

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = process.env.KOKORO_DTYPE || 'fp32';
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const PLAN_ONLY = process.argv.includes('--plan-only');   // count the work, render nothing

const INTERVIEW_DIR = path.join(ROOT, 'public/audio/interview');
const SPEECH_DIR = path.join(ROOT, 'public/audio/speech');

// Kokoro writes 24kHz mono WAV, which would be ~700MB across the whole app. AAC
// at 64kbps brings that under 35MB with no audible loss at this sample rate, and
// every browser and both native shells play .m4a. afconvert ships with macOS, so
// there is no ffmpeg dependency to install.
const encodeToM4a = (wavPath, m4aPath) => {
  execFileSync('afconvert', [
    '-f', 'm4af',           // MPEG-4 audio container
    '-d', 'aac',            // AAC
    '-b', '64000',          // 64 kbps — plenty for 24kHz mono speech
    '-q', '127',            // highest-quality encoder setting
    '-s', '3',              // variable bitrate
    wavPath, m4aPath,
  ], { stdio: 'pipe' });
};

// Name each file after a hash of the exact words it speaks, in the voice that
// speaks them. Reworded text gets a new name, so stale audio can never be served
// for edited content, and deployed files cache forever with no busting.
const fileFor = (voice, text, prefix = '') =>
  `${prefix}${crypto.createHash('sha256').update(`${voice}|${text}`).digest('hex').slice(0, 12)}.m4a`;

// ── What the app speaks ──────────────────────────────────────
// Every string any module can pass to speakText, gathered from the same data
// files the app imports. Anything missed here is not broken, only spoken by the
// device synthesizer instead — but it is worth keeping in step with the
// speakText call sites in src/modules/.
const collectAppSpeech = () => {
  const texts = new Set();
  const add = (text) => {
    const trimmed = (text || '').trim();
    if (trimmed) texts.add(trimmed);
  };

  // CivicsStudy, Flashcards and PracticeQuiz: the question, the raw answer, and
  // the trimmed-to-count answer that Flashcards actually reads out.
  for (const file of ['questions.json', 'questions128.json']) {
    for (const item of load(file)) {
      add(item.question);
      add(item.answer);
      add(formatSmartAnswer(item.answer, item.question));
    }
  }

  // N400Prep flashcards
  for (const item of load('n400Questions.json')) {
    add(item.question);
    add(item.answer);
  }

  // VocabularyModule: the word, its meaning, and the quiz prompt built from it
  for (const item of load('citizenshipVocabulary.json')) {
    add(item.word);
    add(item.meaning);
    add(`What does ${item.word} mean?`);
  }

  // ReadingPractice / WritingPractice speak the sentence as-is
  load('readingSentences.json').forEach(add);
  load('writingSentences.json').forEach(add);

  return [...texts];
};

// ── The two sets ─────────────────────────────────────────────
// Each returns { dir, manifestPath, manifest, plan } where plan is the list of
// files to render: { file, text, voice }.
const planInterview = () => {
  const plan = [];
  const manifest = {};

  for (const section of load('mockInterview.json')) {
    manifest[section.id] = parseDialogue(section.text).map((turn, index) => {
      const voice = turn.speaker === 'officer' ? OFFICER_VOICE : APP_VOICE;
      // Indexed by turn as well as hashed, so the files sort in reading order.
      const file = fileFor(voice, turn.text, `${section.id}-${index}-`);
      plan.push({ file, text: turn.text, voice });
      return file;
    });
  }

  return { dir: INTERVIEW_DIR, manifestPath: path.join(DATA, 'interviewAudio.json'), manifest, plan };
};

const planSpeech = () => {
  const plan = [];
  const manifest = {};

  for (const text of collectAppSpeech()) {
    const file = fileFor(APP_VOICE, text);
    manifest[text] = file;                    // keyed by the exact text spoken
    plan.push({ file, text, voice: APP_VOICE });
  }

  return { dir: SPEECH_DIR, manifestPath: path.join(DATA, 'speechAudio.json'), manifest, plan };
};

const main = async () => {
  const sets = [
    ...(ONLY === 'speech' ? [] : [planInterview()]),
    ...(ONLY === 'interview' ? [] : [planSpeech()]),
  ];

  // Work out everything that needs rendering before loading the model, so a run
  // with nothing to do costs nothing.
  for (const set of sets) {
    fs.mkdirSync(set.dir, { recursive: true });
    set.todo = set.plan.filter((item) => FORCE || !fs.existsSync(path.join(set.dir, item.file)));

    // Write the manifest up front. It is decided by the plan, not by the
    // rendering, and writing it now means the app builds and runs against a
    // half-rendered set — every file not there yet simply falls back to live
    // speech instead of breaking the build.
    fs.writeFileSync(set.manifestPath, JSON.stringify(set.manifest, null, 2) + '\n');

    const chars = set.todo.reduce((n, item) => n + item.text.length, 0);
    console.log(
      `${path.basename(set.dir)}/: ${set.plan.length} lines, ${set.todo.length} to render (${chars.toLocaleString()} chars)`
    );
  }

  const todoCount = sets.reduce((n, set) => n + set.todo.length, 0);
  if (PLAN_ONLY) return;

  if (todoCount) {
    console.log(`Loading ${MODEL_ID} (${DTYPE})… first run downloads the model.`);
    const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: DTYPE, device: 'cpu' });

    let done = 0;
    const started = Date.now();
    for (const set of sets) {
      const tmpWav = path.join(set.dir, '.tmp.wav');
      for (const item of set.todo) {
        const audio = await tts.generate(item.text, { voice: item.voice });
        await audio.save(tmpWav);
        encodeToM4a(tmpWav, path.join(set.dir, item.file));

        done += 1;
        if (done % 25 === 0 || done === todoCount) {
          const elapsed = (Date.now() - started) / 1000;
          const left = Math.round((elapsed / done) * (todoCount - done));
          console.log(`  ${done}/${todoCount}  (~${Math.floor(left / 60)}m ${left % 60}s left)  ${item.text.slice(0, 48)}`);
        }
      }
      fs.rmSync(tmpWav, { force: true });
    }
  }

  // Write the manifests and drop files whose text has since changed or gone.
  let bytes = 0;
  let files = 0;
  for (const set of sets) {
    const wanted = new Set(set.plan.map((item) => item.file));
    const stale = fs.readdirSync(set.dir).filter((f) => f.endsWith('.m4a') && !wanted.has(f));
    stale.forEach((f) => fs.rmSync(path.join(set.dir, f)));
    if (stale.length) console.log(`Removed ${stale.length} stale file(s) from ${path.basename(set.dir)}/.`);

    fs.writeFileSync(set.manifestPath, JSON.stringify(set.manifest, null, 2) + '\n');

    for (const f of wanted) {
      bytes += fs.statSync(path.join(set.dir, f)).size;
      files += 1;
    }
  }

  console.log(`Done. ${files} files, ${(bytes / 1024 / 1024).toFixed(1)}MB under public/audio/.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
