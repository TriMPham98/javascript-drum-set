let isRecording = false;
let recordedNotes = [];
let recordingStartTime = 0;

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

  if (isRecording) {
    recordedNotes = [];
    recordingStartTime = Date.now();
    recordBtn.textContent = "Stop Recording";
    playBtn.disabled = true;
  } else {
    recordBtn.textContent = "Record";
    playBtn.disabled = recordedNotes.length === 0;
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
