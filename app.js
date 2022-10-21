// get the element we're listening for and print what was pressed in the console
window.addEventListener("keydown", function (e) {
  // looks for one element with the audio tag that corresponds with the key pressed
  const audio = document.querySelector(`audio[data-key="${e.keyCode}"]`);
  if (!audio) return; // if no audio found, stops function from running altogether

  // looks for one element with the key tag that corresponds with the key pressed
  const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);

  audio.currentTime = 0; // rewinds audio from start instead of waiting for .wav file to finish before playing again
  audio.play(); // plays the .wav file that corresponds to the key code
  console.log(key);

  key.classList.add("playing"); // adds the css class "playing" on key press
});
