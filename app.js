function playSound(e) {
  // looks for one element with the audio tag that corresponds with the key pressed
  const AUDIO = document.querySelector(`audio[data-key="${e.keyCode}"]`);
  if (!AUDIO) return; // if no audio found, stops function from running altogether

  // looks for one element with the key tag that corresponds with the key pressed
  const KEY = document.querySelector(`.key[data-key="${e.keyCode}"]`);

  // TODO: Add Hi Hat Sizzle using conditional
  if (isClosedOrFootHiHat(AUDIO)) stopOpenHiHat();

  AUDIO.currentTime = 0; // rewinds audio from start instead of waiting for .wav file to finish before playing again
  AUDIO.play(); // plays the .wav file that corresponds to the key code

  KEY.classList.add("playing"); // adds the css class "playing" on key press
}

function isClosedOrFootHiHat(AUDIO) {
  const HIHAT_AUDIO_KEY = "70";
  const HIHAT_FOOT_AUDIO_KEY = "84";
  const currentAudioKey = AUDIO.getAttribute("data-key");
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

function stopAudio(AUDIO) {
  AUDIO.pause();
  AUDIO.currentTime = 0;
}

function isPlaying(AUDIO) {
  return AUDIO.currentTime;
}

function removeTransition(e) {
  this.classList.remove("playing"); // removes the css class "playing" once transition is done
}

const KEYS = document.querySelectorAll(".key"); // gives an array of every element matched
KEYS.forEach((key) => key.addEventListener("transitionend", removeTransition)); // calls the removeTransition function
window.addEventListener("keydown", playSound);
