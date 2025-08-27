let mode = "live"; // "live" or "sequencer"
let isRecording = false;
let recordedNotes = [];
let recordingStartTime = 0;
let isPlaying = false;
let currentStep = 0;
let lastTime = 0;

const instruments = [
  { key: "65", name: "snare", label: "A" },
  { key: "87", name: "rim click", label: "W" },
  { key: "68", name: "kick", label: "D" },
  { key: "70", name: "hi hat", label: "F" },
  { key: "84", name: "hi hat foot", label: "T" },
  { key: "72", name: "open hat", label: "H" },
  { key: "74", name: "crash", label: "J" },
  { key: "75", name: "ride", label: "K" },
  { key: "79", name: "ride bell", label: "O" },
  { key: "186", name: "tambourine", label: ";" },
];

const grid = Array(instruments.length)
  .fill()
  .map(() => Array(16).fill(false));

function playSound(e) {
  if (mode !== "live") return;

  const key =
    e.type === "click"
      ? e.target.closest(".key")
      : document.querySelector(`.key[data-key="${e.keyCode}"]`);
  const audio = document.querySelector(
    `audio[data-key="${key ? key.getAttribute("data-key") : e.keyCode}"]`
  );

  if (!audio) return;

  if (isClosedOrFootHiHat(audio)) stopOpenHiHat();

  audio.currentTime = 0;
  audio.play();

  if (isRecording) {
    recordedNotes.push({
      keyCode: key ? key.getAttribute("data-key") : e.keyCode,
      time: Date.now() - recordingStartTime,
    });
  }

  if (audio.getAttribute("data-key") === "74") {
    const kickAudio = document.querySelector('audio[data-key="68"]');
    if (kickAudio) {
      kickAudio.currentTime = 0;
      kickAudio.play();
      if (isRecording) {
        recordedNotes.push({
          keyCode: "68",
          time: Date.now() - recordingStartTime,
        });
      }
    }
  }

  key.classList.add("playing");
}

function removePlayingClass(e) {
  if (e.propertyName !== "transform") return;
  this.classList.remove("playing");
}

function handleKeyUp(e) {
  if (mode !== "live") return;
  const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
  if (key) key.classList.remove("playing");
}

function isClosedOrFootHiHat(audio) {
  const HIHAT_AUDIO_KEY = "70";
  const HIHAT_FOOT_AUDIO_KEY = "84";
  const currentAudioKey = audio.getAttribute("data-key");
  return (
    currentAudioKey == HIHAT_AUDIO_KEY ||
    currentAudioKey == HIHAT_FOOT_AUDIO_KEY
  );
}

function stopOpenHiHat() {
  const OPEN_HIHAT_AUDIO_KEY = "72";
  const openHiHatAudio = document.querySelector(
    `audio[data-key="${OPEN_HIHAT_AUDIO_KEY}"]`
  );
  if (isPlayingAudio(openHiHatAudio)) stopAudio(openHiHatAudio);
}

function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function isPlayingAudio(audio) {
  return !audio.paused;
}

function handleTouch(e) {
  if (mode !== "live") return;
  e.preventDefault();
  const touch = e.changedTouches[0];
  const key = document.elementFromPoint(touch.clientX, touch.clientY);
  if (key && key.classList.contains("key")) {
    playSound({ target: key });
  }
}

function toggleRecording() {
  if (mode !== "live") return;
  isRecording = !isRecording;
  const recordBtn = document.getElementById("recordBtn");
  const playBtn = document.getElementById("playBtn");
  const quantizeBtn = document.getElementById("quantizeBtn");
  const visualizeBtn = document.getElementById("visualizeBtn");

  if (isRecording) {
    recordedNotes = [];
    recordingStartTime = Date.now();
    recordBtn.textContent = "Stop Recording";
    playBtn.disabled = true;
    quantizeBtn.disabled = true;
    visualizeBtn.disabled = true;
  } else {
    recordBtn.textContent = "Record";
    playBtn.disabled = recordedNotes.length === 0;
    quantizeBtn.disabled = recordedNotes.length === 0;
    visualizeBtn.disabled = recordedNotes.length === 0;
  }
}

function playRecording() {
  if (mode !== "live" || recordedNotes.length === 0) return;

  const playBtn = document.getElementById("playBtn");
  playBtn.disabled = true;

  recordedNotes.forEach((note) => {
    setTimeout(() => {
      const audio = document.querySelector(`audio[data-key="${note.keyCode}"]`);
      const key = document.querySelector(`.key[data-key="${note.keyCode}"]`);
      if (audio && key) {
        if (isClosedOrFootHiHat(audio)) stopOpenHiHat();
        audio.currentTime = 0;
        audio.play();
        key.classList.add("playing");
        setTimeout(() => key.classList.remove("playing"), 100);
      }
    }, note.time);
  });

  setTimeout(() => {
    playBtn.disabled = false;
  }, recordedNotes[recordedNotes.length - 1].time + 100);
}

function quantizeRecording() {
  if (mode !== "live" || recordedNotes.length === 0) return;

  const bpm = parseInt(document.getElementById("bpm").value) || 120;
  const n = parseInt(document.getElementById("quantizeRes").value) || 16;
  const msPerBeat = 60000 / bpm;
  const snap = msPerBeat / (n / 4);

  recordedNotes.forEach((note) => {
    note.time = Math.round(note.time / snap) * snap;
  });

  recordedNotes.sort((a, b) => a.time - b.time);
  visualizeRecording();
}

function toggleCell(e) {
  if (mode !== "sequencer") return;

  const canvas = document.getElementById("visualization");
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const trackHeight = canvas.height / instruments.length;
  const cellWidth = canvas.width / 16;
  const row = Math.floor(y / trackHeight);
  const col = Math.floor(x / cellWidth);

  if (row >= 0 && row < instruments.length && col >= 0 && col < 16) {
    grid[row][col] = !grid[row][col];
    visualizeRecording();
  }
}

function visualizeRecording() {
  const canvas = document.getElementById("visualization");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bpm = parseInt(document.getElementById("bpm").value) || 120;
  const msPerBeat = 60000 / bpm;
  const measures = 4;
  const beatsPerMeasure = 4;
  const totalBeats = measures * beatsPerMeasure;
  const trackHeight = canvas.height / instruments.length;
  const cellWidth = canvas.width / totalBeats;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= totalBeats; i++) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let i = 0; i <= instruments.length; i++) {
    const y = i * trackHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= measures; i++) {
    const x = i * cellWidth * beatsPerMeasure;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "white";
  instruments.forEach((inst, i) => {
    ctx.fillText(
      `${inst.label} ${inst.name}`,
      10,
      i * trackHeight + trackHeight / 2 + 4
    );
  });

  ctx.fillStyle = "#ffc600";
  if (mode === "live") {
    const totalTime = msPerBeat * totalBeats;
    recordedNotes.forEach((note) => {
      const instIndex = instruments.findIndex(
        (i) => i.key === note.keyCode.toString()
      );
      if (instIndex !== -1 && note.time <= totalTime) {
        const beat = Math.floor((note.time / msPerBeat) % totalBeats);
        const x = beat * cellWidth + cellWidth / 2;
        const y = instIndex * trackHeight + trackHeight / 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else {
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          const x = colIndex * cellWidth + cellWidth / 2;
          const y = rowIndex * trackHeight + trackHeight / 2;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    if (isPlaying) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      const x = currentStep * cellWidth;
      ctx.fillRect(x, 0, cellWidth, canvas.height);
    }
  }
}

function playStep() {
  if (!isPlaying || mode !== "sequencer") return;

  const bpm = parseInt(document.getElementById("bpm").value) || 120;
  const n = parseInt(document.getElementById("quantizeRes").value) || 16;
  const msPerBeat = 60000 / bpm;
  const stepDuration = msPerBeat / (n / 4);

  grid.forEach((row, rowIndex) => {
    if (row[currentStep]) {
      const audio = document.querySelector(
        `audio[data-key="${instruments[rowIndex].key}"]`
      );
      if (audio) {
        if (isClosedOrFootHiHat(audio)) stopOpenHiHat();
        audio.currentTime = 0;
        audio.play();
        if (audio.getAttribute("data-key") === "74") {
          const kickAudio = document.querySelector('audio[data-key="68"]');
          if (kickAudio) {
            kickAudio.currentTime = 0;
            kickAudio.play();
          }
        }
      }
    }
  });

  currentStep = (currentStep + 1) % 16;
  visualizeRecording();

  const now = performance.now();
  const delay = stepDuration - (now - lastTime);
  lastTime = now;

  setTimeout(playStep, delay);
}

function startPlaying() {
  if (mode !== "sequencer") {
    playRecording();
    return;
  }
  if (isPlaying) {
    stopPlaying();
    return;
  }
  isPlaying = true;
  currentStep = 0;
  lastTime = performance.now();
  document.getElementById("playBtn").textContent = "Pause";
  playStep();
}

function stopPlaying() {
  if (mode === "sequencer") {
    isPlaying = false;
    currentStep = 0;
    document.getElementById("playBtn").textContent = "Play";
    visualizeRecording();
  }
}

function clearGrid() {
  if (mode === "live") {
    recordedNotes = [];
    document.getElementById("playBtn").disabled = true;
    document.getElementById("quantizeBtn").disabled = true;
    document.getElementById("visualizeBtn").disabled = true;
  } else {
    grid.forEach((row) => row.fill(false));
  }
  visualizeRecording();
}

function toggleMode() {
  mode = mode === "live" ? "sequencer" : "live";
  const modeBtn = document.getElementById("modeBtn");
  const keys = document.querySelector(".keys");
  const recordBtn = document.getElementById("recordBtn");
  const quantizeBtn = document.getElementById("quantizeBtn");
  const playBtn = document.getElementById("playBtn");
  const visualizeBtn = document.getElementById("visualizeBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (mode === "live") {
    modeBtn.textContent = "Switch to Sequencer";
    keys.classList.remove("hidden");
    recordBtn.disabled = false;
    quantizeBtn.disabled = recordedNotes.length === 0;
    playBtn.disabled = recordedNotes.length === 0;
    visualizeBtn.disabled = recordedNotes.length === 0;
    clearBtn.disabled = recordedNotes.length === 0;
    document.getElementById("visualization").style.cursor = "auto";
    stopPlaying();
  } else {
    modeBtn.textContent = "Switch to Live";
    keys.classList.add("hidden");
    recordBtn.disabled = true;
    quantizeBtn.disabled = true;
    playBtn.disabled = false;
    visualizeBtn.disabled = false;
    clearBtn.disabled = false;
    document.getElementById("visualization").style.cursor = "pointer";
    recordedNotes = [];
  }
  visualizeRecording();
}

const keys = document.querySelectorAll(".key");
keys.forEach((key) => {
  key.addEventListener("transitionend", removePlayingClass);
  key.addEventListener("click", playSound);
});

window.addEventListener("keydown", playSound);
window.addEventListener("keyup", handleKeyUp);

const keysContainer = document.querySelector(".keys");
keysContainer.addEventListener("touchstart", handleTouch);
keysContainer.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys.forEach((key) => key.classList.remove("playing"));
});

document.body.addEventListener("touchstart", (e) => e.preventDefault(), {
  passive: false,
});
document.body.addEventListener("touchend", (e) => e.preventDefault(), {
  passive: false,
});

document.getElementById("modeBtn").addEventListener("click", toggleMode);
document.getElementById("recordBtn").addEventListener("click", toggleRecording);
document.getElementById("playBtn").addEventListener("click", startPlaying);
document.getElementById("stopBtn").addEventListener("click", stopPlaying);
document
  .getElementById("quantizeBtn")
  .addEventListener("click", quantizeRecording);
document
  .getElementById("visualizeBtn")
  .addEventListener("click", visualizeRecording);
document.getElementById("clearBtn").addEventListener("click", clearGrid);
document.getElementById("visualization").addEventListener("click", toggleCell);

visualizeRecording();
