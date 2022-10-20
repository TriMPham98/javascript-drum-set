// get the element we're listening for and print what was pressed in the console
window.addEventListener("keydown", function (e) {
  // looks for one element with the audio tag that corresponds with the key pressed
  const audio = document.querySelector(`audio[data-key="${e.keyCode}"]`);
  console.log(audio);
});
