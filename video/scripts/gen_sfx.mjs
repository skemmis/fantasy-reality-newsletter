#!/usr/bin/env node
/**
 * Synthesize the show's chiptune one-shot SFX into public/assets/sfx/*.wav
 * using jsfxr (pure JS sfxr port — runs fine in Node, no network, no
 * downloads). Params are explicit (no preset randomness) so the output is
 * deterministic run-to-run.
 *
 *   node scripts/gen_sfx.mjs
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import jsfxr from 'jsfxr';

const {sfxr, Params} = jsfxr;

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'sfx');
mkdirSync(OUT_DIR, {recursive: true});

// wave_type: 0 square, 1 saw, 2 sine, 3 noise
const make = (overrides) => {
  const p = new Params();
  Object.assign(p, {
    wave_type: 0,
    p_env_attack: 0,
    p_env_sustain: 0.08,
    p_env_punch: 0,
    p_env_decay: 0.15,
    p_base_freq: 0.4,
    p_freq_limit: 0,
    p_freq_ramp: 0,
    p_freq_dramp: 0,
    p_vib_strength: 0,
    p_vib_speed: 0,
    p_arp_mod: 0,
    p_arp_speed: 0,
    p_duty: 0.4,
    p_duty_ramp: 0,
    p_repeat_speed: 0,
    p_pha_offset: 0,
    p_pha_ramp: 0,
    p_lpf_freq: 1,
    p_lpf_ramp: 0,
    p_lpf_resonance: 0,
    p_hpf_freq: 0,
    p_hpf_ramp: 0,
    sound_vol: 0.6,
    sample_rate: 44100,
    sample_size: 16,
    ...overrides,
  });
  return p;
};

const SOUNDS = {
  // UI select blip — title word slams.
  blip: make({p_base_freq: 0.62, p_env_sustain: 0.15, p_env_decay: 0.15}),
  // Rising chirp — annotation callout pops in.
  'pop-in': make({
    p_base_freq: 0.38,
    p_freq_ramp: 0.28,
    p_env_sustain: 0.18,
    p_env_decay: 0.25,
    p_env_punch: 0.4,
  }),
  // Filtered noise sweep up — zoom in.
  'whoosh-up': make({
    wave_type: 3,
    p_base_freq: 0.16,
    p_freq_ramp: 0.32,
    p_env_attack: 0.3,
    p_env_sustain: 0.35,
    p_env_decay: 0.4,
    p_lpf_freq: 0.55,
    p_lpf_ramp: 0.3,
  }),
  // Filtered noise sweep down — settle / pull back.
  'whoosh-down': make({
    wave_type: 3,
    p_base_freq: 0.5,
    p_freq_ramp: -0.3,
    p_env_attack: 0.3,
    p_env_sustain: 0.35,
    p_env_decay: 0.4,
    p_lpf_freq: 0.6,
    p_lpf_ramp: -0.25,
  }),
  // Tiny odometer tick — counter milestones.
  tick: make({p_base_freq: 0.78, p_env_sustain: 0.08, p_env_decay: 0.1, sound_vol: 0.5}),
  // Coin arpeggio — endcard scoreboard.
  'ka-ching': make({
    p_base_freq: 0.62,
    p_arp_mod: 0.45,
    p_arp_speed: 0.62,
    p_env_sustain: 0.3,
    p_env_decay: 0.45,
    p_env_punch: 0.5,
  }),
  // Two-tone warble — the tariff whipsaw moment.
  alarm: make({
    p_base_freq: 0.42,
    p_arp_mod: -0.35,
    p_arp_speed: 0.5,
    p_repeat_speed: 0.55,
    p_env_sustain: 0.42,
    p_env_decay: 0.25,
    p_duty: 0.25,
    sound_vol: 0.5,
  }),
  // Low damped hit — hard cuts.
  thud: make({
    wave_type: 3,
    p_base_freq: 0.17,
    p_freq_ramp: -0.28,
    p_env_sustain: 0.12,
    p_env_decay: 0.35,
    p_env_punch: 0.6,
    p_lpf_freq: 0.32,
  }),
};

for (const [name, params] of Object.entries(SOUNDS)) {
  // toWave(p).wav is the complete RIFF/WAV byte array
  // (toBuffer would be headerless raw samples).
  const bytes = sfxr.toWave(params).wav;
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, Buffer.from(bytes));
  console.log(`wrote ${file} (${bytes.length} bytes)`);
}
