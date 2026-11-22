// Ember Duel — original sounds, synthesized live with WebAudio.
// No audio files: every blip is an oscillator, so the game loads nothing.

let audioContext = null;

function context() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(freq, seconds, type = 'sine', volume = 0.12, when = 0) {
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + seconds + 0.02);
}

export const sound = {
  /** Unlock audio on the first gesture; browsers require it. */
  unlock() { context(); },
  playCard() { tone(520, 0.09, 'triangle', 0.1); tone(780, 0.12, 'triangle', 0.08, 0.05); },
  strike() { tone(180, 0.16, 'sawtooth', 0.12); tone(90, 0.2, 'square', 0.08, 0.04); },
  guard() { tone(320, 0.14, 'sine', 0.1); tone(480, 0.18, 'sine', 0.08, 0.06); },
  heal() { tone(660, 0.12, 'sine', 0.09); tone(880, 0.2, 'sine', 0.08, 0.08); },
  draw() { tone(440, 0.07, 'triangle', 0.07); tone(590, 0.09, 'triangle', 0.06, 0.05); },
  chain() { tone(700, 0.08, 'triangle', 0.09); tone(940, 0.1, 'triangle', 0.09, 0.05); tone(1240, 0.14, 'triangle', 0.08, 0.1); },
  turn() { tone(392, 0.1, 'triangle', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.1, i * 0.14)); },
};
