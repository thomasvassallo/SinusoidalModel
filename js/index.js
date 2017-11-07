// Load the sound from the URL only once and store it in global variable audioData

var data = {
  audioArray: false,
  sampleRate: false,
  bufferLength: false
};

function loadSound(url) {
  var request = new XMLHttpRequest();
  $("#analysisPanel").removeClass('hidden');
  $("#analysisButton").removeClass('disabled');
  console.log(url);
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  // When loaded, decode the data and play the sound
  request.onload = function() {
    audio_context.decodeAudioData(request.response, function(buffer) {
      console.log("Buffer length " + buffer.duration);
      var audioData = buffer;
      data.sampleRate = audioData.sampleRate;
      data.audioArray = audioData.getChannelData(0);
      data.bufferLength = buffer.duration;
    }, onError);
  }
  request.send();
}

function onError(e) {
  console.log(e);
}

function triggerAnalysis() {
  var w1Length = parseInt(document.getElementById("analysisWindowInput").value);
  var n1 = parseInt(document.getElementById("hopSizeInput").value);
  var nSines = parseInt(document.getElementById("nSinesInput").value);
  
  $("#analysisPanel").addClass("hidden");
    
  if (typeof(Worker) !== "undefined") {
    var analysisWorker = new Worker('js/analysis.js');
    analysisWorker.postMessage([data.audioArray, data.sampleRate, w1Length, n1, nSines]);
    var progressBar = document.querySelector(".progress-bar div");
    analysisWorker.onmessage = function(e) {
      if (e.data.type == "finished") {
        processAnalysis(e.data.payload);
      }

      if (e.data.type == "progress") {
        // console.log('update progress NOW');
        // console.log(e.data.payload);
        // console.log(e.data.maxCount);

        $("#block").width(e.data.payload / (e.data.maxCount / $("#blockContainer").width()));
        block.innerHTML = "<span style='font-size:15px'>" + Math.floor((e.data.payload / e.data.maxCount)*100) + "%" + "</span>";
        block.style.color = 'white';
      }
    }
  } else {
    alert('Sorry - your browser does not support web workers.');
  }

}

function processAnalysis(analysisData) {
  var frametime = analysisData.frametime;
  var SineFreq = analysisData.sineFrequency;
  var SineAmp = analysisData.sineAmplification;
  $("#inputPanel").addClass('hidden');
  $("#loader").addClass("hidden");
  $("#synthesisPanel").removeClass("hidden");
  $("#newButton").removeClass("hidden");
  $("#playButton").removeClass("disabled");

  var N = SineFreq[0].length;
  var xAxis = Array.apply(null, {
    length: N
  }).map(Number.call, Number)
  for (var i = 0; i < xAxis.length; i++) {
    xAxis[i] = xAxis[i] * frametime;
  }

  var numFrames = analysisData.frames;
  var SineAmpPlots = math.zeros([SineAmp.length, SineAmp[0].length]);
  for (var n = 0; n < SineAmp.length; n++) {
    for (var m = 0; m < numFrames; m++) {
      if (m == 0) {
        SineAmpPlots[n][m] = Math.pow(10, (SineAmp[n][m + 1] / 20));
      } else {
        SineAmpPlots[n][m] = Math.pow(10, (SineAmp[n][m] / 20));
      }
    }
  }
  var nSines = analysisData.numSines;
  ampObjects = createTrace(nSines, SineAmpPlots, xAxis);
  freqObjects = createTrace(nSines, SineFreq, xAxis);


  var layoutGains = {
    title: 'Magnitude',
    xaxis: {
      title: 'Time',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: 'Gain',
      showline: true
    }
  };

  var layoutFreqs = {
    title: 'Frequency',
    xaxis: {
      title: 'Time',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      type: 'log',
      title: 'Frequency',
      showline: true
    }
  };

  Plotly.newPlot('sineAmpDiv', ampObjects, layoutGains);
  Plotly.newPlot('sineFreqDiv', freqObjects, layoutFreqs);

  document.getElementById('playButton').addEventListener('click', function() {
    playSound(nSines, numFrames, frametime, SineFreq, SineAmp);
  }, false);

  createOsc(nSines, SineFreq);
}


function playSound(nSines, numFrames, frametime, SineFreq, SineAmp) {
  console.log("Playsound");
  // console.log("nsines " + nSines)
  // console.log("numFrames " + numFrames)
  // console.log("frametime " + frametime)
  // console.log("SineFreq " + SineFreq)
  // console.log("SineAmp " + SineAmp)

  var pitchInput = parseInt(document.getElementById("pitchInput").value);
  var timeInput = parseInt(document.getElementById("timeInput").value);
  var pitchMultiplier;
  var timeMultiplier;

  if (pitchInput == 0) {
    pitchMultiplier = 1;
  } else if (pitchInput > 0) {
    pitchMultiplier = scaleBetween(pitchInput, 1, 2, 0, 100);
  } else if (pitchInput < 0) {
    pitchMultiplier = scaleBetween(pitchInput, 0.5, 1, -100, 0)
  }

  if (timeInput == 0) {
    timeMultiplier = 1;
  } else if (timeInput > 0) {
    timeMultiplier = scaleBetween(timeInput, 1, 2, 0, 100);
  } else if (timeInput < 0) {
    timeMultiplier = scaleBetween(timeInput, 0.5, 1, -100, 0)
  }

  // play 
  // var numFrames = (pin / n1);
  var SineAmpGains = math.zeros([SineAmp.length, SineAmp[0].length]);
  for (var n = 0; n < SineAmp.length; n++) {
    for (var m = 0; m < numFrames; m++) {
      if (m == 0) {
        SineAmpGains[n][m] = 0;
      } else {
        SineAmpGains[n][m] = Math.pow(10, (SineAmp[n][m] / 20));
      }
    }
  }

  frametime = frametime * timeMultiplier;

  var startTime = audio_context.currentTime + 0.100; // start playing 100 milliseconds from now
  for (var j = 0; j < nSines; j++) {
    window['gainNode' + j].gain.linearRampToValueAtTime(0, startTime + (numFrames * frametime)); // set to zero at end
  }

  var x = [];
  for (var env = 0; env < numFrames; env++) {
    var time = startTime + env * frametime; // go forwards one audio frame
    for (var j = 0; j < nSines; j++) {
      window['oscNode' + j].frequency.linearRampToValueAtTime(SineFreq[j][env] * pitchMultiplier, time);
      window['gainNode' + j].gain.linearRampToValueAtTime(SineAmpGains[j][env], time); // apply new gain, interpolate from previous gain
    }
  }
}

function createOsc(nOsc, freqs) {
  // create the numbered oscillator nodes and gain nodes dynamically
  for (var j = 0; j < nOsc; j++) {
    // console.log(freqs[j][1])
    window['oscNode' + j] = audio_context.createOscillator(); // oscNode1, oscNode2, ...
    window['gainNode' + j] = audio_context.createGain(); // gainNode1, gainNode2, ...
    window['oscNode' + j].connect(window['gainNode' + j]); // connect osc to gain
    window['gainNode' + j].connect(audio_context.destination); // connect to destination

    window['oscNode' + j].frequency.value = freqs[j][1]; // fixed frequency
    window['gainNode' + j].gain.value = 0.0; // zero to start
    window['oscNode' + j].start(0); // start oscillator
    numOsc = nOsc;
  }
};

function log10(x) {
  return Math.log(x) / Math.LN10;
}

function progress(percent, $element) {
  var progressBarWidth = percent * $element.width() / 100;
  $element.find('div').animate({
    width: progressBarWidth
  }, 1).html(percent + "% ");
}

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function createTrace(n, inputMatrix, xAxis) {
  var traceArr = [];
  var sineIndex;
  for (var i = 0; i < n; i++) {
    sineIndex = i + 1;
    traceArr.push({
      x: xAxis,
      y: inputMatrix[i],
      name: 'Sinusoid ' + sineIndex,
      type: 'scatter'
    });
  }
  return traceArr;
}