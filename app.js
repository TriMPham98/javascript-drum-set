let isRecording = false;
let recordedNotes = [];
let recordingStartTime = 0;

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

function playSound(e) {
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

  // Record note if recording is active
  if (isRecording) {
    recordedNotes.push({
      keyCode: key ? key.getAttribute("data-key") : e.keyCode,
      time: Date.now() - recordingStartTime,
    });
  }

  // If the crash is played, also play the kick
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
  if (isPlaying(openHiHatAudio)) stopAudio(openHiHatAudio);
}

function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function isPlaying(audio) {
  return !audio.paused;
}

function handleTouch(e) {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const key = document.elementFromPoint(touch.clientX, touch.clientY);
  if (key && key.classList.contains("key")) {
    playSound({ target: key });
  }
}

function toggleRecording() {
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
  if (recordedNotes.length === 0) return;

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
  if (recordedNotes.length === 0) return;

  const bpm = parseInt(document.getElementById("bpm").value) || 120;
  const n = parseInt(document.getElementById("quantizeRes").value) || 16;
  const msPerBeat = 60000 / bpm;
  const snap = msPerBeat / (n / 4);

  recordedNotes.forEach((note) => {
    note.time = Math.round(note.time / snap) * snap;
  });

  // Sort notes by time in case of adjustments
  recordedNotes.sort((a, b) => a.time - b.time);

  visualizeRecording(); // Redraw after quantize
}

function visualizeRecording() {
  const canvas = document.getElementById("visualization");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (recordedNotes.length === 0) return;

  const bpm = parseInt(document.getElementById("bpm").value) || 120;
  const msPerBeat = 60000 / bpm;
  const measures = 4;
  const beatsPerMeasure = 4;
  const totalBeats = measures * beatsPerMeasure;
  const totalTime = msPerBeat * totalBeats;

  const trackHeight = canvas.height / instruments.length;
  const cellWidth = canvas.width / totalBeats;

  // Draw grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;

  // Vertical lines (beats)
  for (let i = 0; i <= totalBeats; i++) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines (instruments)
  for (let i = 0; i <= instruments.length; i++) {
    const y = i * trackHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw measure lines thicker
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= measures; i++) {
    const x = i * cellWidth * beatsPerMeasure;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw track labels
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "white";
  instruments.forEach((inst, i) => {
    ctx.fillText(
      `${inst.label} ${inst.name}`,
      10,
      i * trackHeight + trackHeight / 2 + 4
    );
  });

  // Draw notes
  ctx.fillStyle = "#ffc600";
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
}

const keys = document.querySelectorAll(".key");
keys.forEach((key) => {
  key.addEventListener("transitionend", removePlayingClass);
  key.addEventListener("click", playSound);
});

// Event listeners
window.addEventListener("keydown", playSound);
window.addEventListener("keyup", handleKeyUp);

// Add touch event listeners
const keysContainer = document.querySelector(".keys");
keysContainer.addEventListener("touchstart", handleTouch);
keysContainer.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys.forEach((key) => key.classList.remove("playing"));
});

// Prevent default touch behavior on the entire document
document.body.addEventListener("touchstart", (e) => e.preventDefault(), {
  passive: false,
});
document.body.addEventListener("touchend", (e) => e.preventDefault(), {
  passive: false,
});

// Add recording controls event listeners
document.getElementById("recordBtn").addEventListener("click", toggleRecording);
document.getElementById("playBtn").addEventListener("click", playRecording);
document
  .getElementById("quantizeBtn")
  .addEventListener("click", quantizeRecording);
document
  .getElementById("visualizeBtn")
  .addEventListener("click", visualizeRecording);
