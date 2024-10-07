import './main.scss';

const mousePos = { x: 0, y: 0 };
const interpolated = { x: 0, y: 0 };

const distance = { x: 0, y: 0 };

['touchstart', 'touchmove', 'mousemove'].forEach((event) => {
  window.addEventListener(event, (e) => {
    const x =
      event === 'touchstart' || event === 'touchmove'
        ? e.touches[0].clientX
        : e.clientX;
    const y =
      event === 'touchstart' || event === 'touchmove'
        ? e.touches[0].clientY
        : e.clientY;

    mousePos.x = x;
    mousePos.y = y;
  });
});

const mouse = document.createElement('div');
const size = 40;
Object.assign(mouse.style, {
  background: 'red',
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: `${size}px`,
});

document.body.appendChild(mouse);

const closestMultiple = (value, multiple) => {
  return Math.round(value / multiple) * multiple;
};

function calculateFrequency(baseFrequency, semitonesAway) {
  const semitoneRatio = Math.pow(2, 1 / 12);
  return baseFrequency * Math.pow(semitoneRatio, semitonesAway);
}

const range = 12;
const baseFreq = calculateFrequency(440, -18);
const ratio1 = 0.24;
const ratio2 = 0.25 * ratio1;

document.documentElement.style.backgroundSize = `calc(100% / ${range})`;

const audioContext = new AudioContext();

const chord = [-24, 3, 7 - 12, 10, 14 - 12];

const oscillators = chord.map((note) => ({
  note,
  osc: audioContext.createOscillator(),
  connected: false,
  started: false,
}));

const mix = 0.6;

const gainNodeDry = audioContext.createGain();
gainNodeDry.gain.setValueAtTime(
  ((1 - mix) * (0.8 * 1)) / oscillators.length,
  audioContext.currentTime
);
gainNodeDry.connect(audioContext.destination);

const gainNodeWet = audioContext.createGain();
gainNodeWet.gain.setValueAtTime(
  (mix * (0.8 * 1)) / oscillators.length,
  audioContext.currentTime
);
gainNodeWet.connect(audioContext.destination);

const convolver = audioContext.createConvolver();
const createImpulseResponse = (duration, decay) => {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  for (let i = 0; i < 2; i++) {
    const channelData = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channelData[j] =
        (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
    }
  }
  return impulse;
};

convolver.buffer = createImpulseResponse(1.0, 1.0);

const lp = audioContext.createBiquadFilter();
lp.type = 'lowpass';
lp.frequency.setValueAtTime(400, audioContext.currentTime);
lp.connect(convolver);

lp.connect(gainNodeDry);
convolver.connect(gainNodeWet);

oscillators.forEach(({ osc }) => {
  osc.type = 'sawtooth';
  osc.connect(lp);
});

const adjust = (x, y) => {
  const ratio = y / window.innerHeight;
  lp.frequency.setValueAtTime(
    200 + 4400 * Math.pow(1 - ratio, 2),
    audioContext.currentTime
  );

  oscillators.forEach((osc) => {
    osc.osc.frequency.setValueAtTime(
      calculateFrequency(baseFreq, osc.note + (range * x) / window.innerWidth),
      audioContext.currentTime
    );
  });

  const value = mix * (0.8 * 1);
  gainNodeWet.gain.setValueAtTime(
    (value + (1.5 - value) * 1.5 * Math.pow(1 - ratio, 2)) / oscillators.length,
    audioContext.currentTime
  );
};

let isPlaying = false;

const interpolate = () => {
  const targetX = closestMultiple(mousePos.x, window.innerWidth / range);
  const targetY = closestMultiple(mousePos.y, window.innerWidth / range);

  interpolated.x += ratio1 * (mousePos.x - interpolated.x);
  interpolated.y += ratio1 * (mousePos.y - interpolated.y);

  distance.x += ratio2 * (targetX - interpolated.x - distance.x);

  mouse.style.left = distance.x + interpolated.x + 'px';
  mouse.style.top = interpolated.y + 'px';

  const x = distance.x + interpolated.x;
  const y = interpolated.y;

  adjust(x, y);

  requestAnimationFrame(interpolate);
};

['touchstart', 'mousedown'].forEach((event) => {
  document.addEventListener(event, () => {
    if (!isPlaying) {
      oscillators.forEach((osc) => {
        if (!osc.started) {
          osc.osc.start();
          osc.started = true;
        }

        osc.osc.connect(lp);
        osc.connected = true;
      });

      isPlaying = true;
    }
  });
});

['touchend', 'mouseup'].forEach((event) => {
  document.addEventListener(event, () => {
    if (isPlaying) {
      oscillators.forEach((osc) => {
        if (osc.connected) {
          osc.osc.disconnect(lp);
          osc.connected = false;
        }
      });

      isPlaying = false;
    }
  });
});

requestAnimationFrame(interpolate);

const unlockAudioContext = (audioContext) => {
  if (audioContext.state === 'suspended') {
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

    const unlock = () => {
      events.forEach(function (event) {
        document.body.removeEventListener(event, unlock);
      });

      audioContext.resume();
    };

    events.forEach(function (event) {
      document.body.addEventListener(event, unlock, false);
    });
  }
};

unlockAudioContext(audioContext);
