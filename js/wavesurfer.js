var wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#23527a',
  progressColor: '#337AB7'
});

var slider = document.querySelector('#slider');

slider.oninput = function () {
  var zoomLevel = Number(slider.value);
  wavesurfer.zoom(zoomLevel);
};

