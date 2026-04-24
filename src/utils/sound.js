// ===== Web Audio API Sound Effects (Synthesized Bells) =====
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Creates a bell-like sound using FM synthesis or multiple harmonics
 */
function playBell(freq, duration, vol = 0.3) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  
  // Harmonics for a bell sound
  const harmonics = [1, 2, 2.4, 3, 3.5, 4];
  const gains = [1, 0.6, 0.4, 0.3, 0.2, 0.1];

  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * h, now);
    
    gain.gain.setValueAtTime(vol * gains[i], now);
    // Exponential decay for the bell ring
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * (1 - i * 0.1));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  });
}

export function playTing() {
  // A clear, high-pitched bell "ting"
  playBell(880, 1.5, 0.2); 
}

export function playGavel() {
  // A deeper, more solid bell "thud" or gavel strike
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Solid thud component (noise)
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Bell ring component
  playBell(330, 1.0, 0.3);
}

export function playSold() {
  // A triumphant sequence of bells
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((f, i) => {
    setTimeout(() => playBell(f, 2.0, 0.2), i * 150);
  });
}

export function playWhoosh() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.3);
}

export function playUnsold() {
  // A low, dissonant bell sound
  playBell(220, 1.5, 0.2);
  setTimeout(() => playBell(180, 2.0, 0.2), 100);
}
