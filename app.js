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
