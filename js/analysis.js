if ('function' === typeof importScripts) {
  importScripts('/js-library/math.js')
  importScripts('/js-library/fft.js')
  importScripts('/js/pickPeaks.js')
  importScripts('/js/bh92generator.js')
  importScripts('/js/maxMinIndex.js')
  importScripts('/js/interpolatedValues.js')
  importScripts('/js/unwrap2Pi.js')
  importScripts('/js/pitchDetection.js')
  importScripts('/js/TWM.js')
  importScripts('/js/createNewTrack.js')
  importScripts('/js/peakTrackSimple.js')

  addEventListener('message', onMessage);

  function onMessage(e) {



    var result = analysis(e.data[0], e.data[1], e.data[2], e.data[3], e.data[4]);

    postMessage({
      type: 'finished',
      payload: result
    });
  }



  function analysis(audioArray, sampleRate, w1LengthInput, n1Input, nSinesInput) {

    var SR = sampleRate;
    var DAFx_in = Array.prototype.slice.call(audioArray);
    var w1Length = w1LengthInput; // analysis window size
    var n1 = n1Input; // analysis window hop size
    var nPeaks = 100; // number of peaks detected

    // var nSines = 12; // number of sinuosoids to track(and synthetise)

    var nSines = nSinesInput;
    console.log("Number of Sines " + nSines);

    var minSpacePeaks = 2; // minimum space(bins) between two picked peaks
    var zp = 2; // zero - padding coefficient
    var rgain = 1.; // gain for the residual component
    var MaxFreq = 11000; // maximum frequency, in Hertz, for plottings
    var MinMag = -100; // minimum magnitude, in dB, for plottings

    /* ------------------ Definition of the windows ------------------------------------------------- */
    // Definition of the analysis window 
    fConst = 2 * math.PI / (w1Length + 1 - 1);



    var N = 10;
    var w1 = Array.apply(null, {
      length: w1Length + 1
    }).map(Number.call, Number);
    w1 = math.subset(w1, math.index(math.range(1, w1Length, true)));

    for (i = 0; i < w1.length; i++) {
      w1[i] = 0.35875 - 0.48829 * Math.cos(fConst * w1[i]) + 0.14128 * Math.cos(fConst * 2 * w1[i]) - 0.01168 * Math.cos(fConst * 3 * w1[i]);
    }

    var w1Sum = math.sum(w1);

    for (i = 0; i < w1.length; i++) {
      w1[i] = w1[i] / w1Sum * 2;
    }

    var N = w1Length * zp; //new size of window

    // Synthesis Window 
    var w2 = w1;
    var n2 = n1;

    // Triangular window
    var winTri = [];
    var winTriLength = (n2 * 2) + 1;
    var aux = (winTriLength + 1) / 2;

    for (n = 0; n < winTriLength; n++) {
      if (n < aux) {
        winTri[n] = n / aux;
      } else {
        winTri[n] = 2 - n / aux;
      }
    }

    // data for the loops
    var frametime = n1 / SR;
    var pin = 0;
    var pout = 0;
    var TuneLength = DAFx_in.length;
    var pend = TuneLength - w1Length;

    var bh92SINE2SINE = bh92SINE2SINEgeneration();
    // bh92SINE2SINE = bh92Matlab.slice();
    var N = 4096;

    //  Definition of the data arrays 
    var zeroPad = math.zeros([w1Length / 2 - n1 - 1]);
    DAFx_in = math.concat(zeroPad, DAFx_in)
    var DAFx_outsine = math.zeros([TuneLength]);
    var DAFx_outres = math.zeros([TuneLength]);

    // arrays for the partial tracking
    var iloc = math.zeros([nSines]);
    var ival = math.zeros([nSines]);
    var iphase = math.zeros([nSines]);
    var previousiloc = math.zeros([nSines]);
    var previousival = math.zeros([nSines]);
    var maxSines = 400; // maximum voices for harmonizer
    var syniloc = math.zeros([maxSines]);
    var synival = math.zeros([maxSines]);
    var previoussyniloc = math.zeros([maxSines]);
    var previousiphase = math.zeros([maxSines]);
    var currentiphase = math.zeros([maxSines]);

    // --- arrays for the sinus' frequencies and amplitudes
    var SineFreq = math.zeros([nSines, math.ceil(TuneLength / n2)]);
    var SineAmp = math.zeros([nSines, math.ceil(TuneLength / n2)]);
    var pitch = math.zeros([1 + math.ceil(pend / n1)]); //Mathlab used as vector with 1,1+math.ceil(pend/n1)
    var pitcherr = math.zeros([1 + math.ceil(pend / n1)]); //Mathlab used as vector with 1,1+math.ceil(pend/n1)

    var phi = [];
    var sineFillSpectrum = [];

    var counterMax = Math.ceil(pend / n1);
    var counter = 0;
    console.log("Total number of frames " + Math.ceil(pend / n1))

    /* ---------------------------------------------------------------------------------- */
    /* -------------------------- Process Block ----------------------------------------- */
    /* ---------------------------------------------------------------------------------- */

    var ftValTest = [];

    while (pin < pend) {

      // Windowing 
      var inputSub = math.subset(DAFx_in, math.index(math.range(pin, pin + w1Length - 1, true)));
      var windowSub = math.subset(w1, math.index(math.range(0, w1Length - 1, true)));
      var grain = math.dotMultiply(inputSub, windowSub);


      // Zero padding
      var padgrain = math.zeros([N]);
      var padgrain = math.subset(padgrain, math.index(math.range(0, w1Length / 2 - 1, true)), math.subset(grain, math.index(math.range(w1Length / 2, w1Length - 1, true))));
      var padgrain = math.subset(padgrain, math.index(math.range(N - w1Length / 2, N - 1, true)), math.subset(grain, math.index(math.range(0, w1Length / 2 - 1, true))));


      // fft computation 
      var reals = padgrain.slice();
      var imags = new Float32Array(N);
      var f = [];

      transform(reals, imags);

      for (var i = 0; i < reals.length; i++) {
        var inputReal = reals[i];
        var inputImags = imags[i]
        f[i] = math.complex(inputReal, inputImags);
      }

      var r = math.abs(f);
      var logF = math.log(f);
      for (var i = 0; i < logF.length; i++) {
        phi[i] = logF[i].im
      }

      var ft = math.dotMultiply(r, math.exp(math.multiply(math.sqrt(-1), phi)));

      /* -------------------------- Analysis ----------------------------------------- */

      // Peak Detection
      pickedPeaks = PickPeaks(math.subset(r, math.index(math.range(0, (N / 2) - 1, true))), nPeaks, minSpacePeaks);
      var ftval = pickedPeaks.value;
      var ftloc = pickedPeaks.location;
      // console.log(pickedPeaks)
      ftValTest[(pin / n1)] = ftval.slice();

      // Interpolate values
      interpolatedValues = InterpolatedValues(r, phi, N, zp, ftloc, ftval);
      var iftloc = interpolatedValues.location;
      var iftphase = interpolatedValues.phase;
      var iftval = interpolatedValues.value;
      // console.log(interpolatedValues)

      // Detect Pitch
      pitchDetection = PitchDetection(r, N, SR, nPeaks, iftloc, iftval);
      var pitchvalue = pitchDetection.value;
      var pitcherror = pitchDetection.error;
      var isHarm = pitchDetection.isHarmonic;
      // console.log(pitchDetection)


      pitch[pin / n1] = pitchvalue * isHarm; // may need to add  plus 1
      pitcherr[pin / n1] = pitcherror; // may need to add  plus 1
      nNewPeaks = nSines;

      if (pin == 0) { // --- for the first frame
        nNewPeaks = nSines;
      } else {
        for (var i = 0; i < nSines; i++) {
          if (previousiloc[i] == 0) {
            var createNewTrack = CreateNewTrack(iftloc, iftval, previousiloc, previousival, nSines, MinMag);
            previousiloc[i] = createNewTrack.location;
            previousival[i] = createNewTrack.value;
            Peaks = nNewPeaks - 1;
          }
        }
        // console.log(previousival)
        // console.log(previousiloc)

        //--- simple Peak tracker
        peakTrackSimple = PeakTrackSimple(nSines, nPeaks, N, SR, pitchvalue, iftloc, iftval, iftphase, isHarm, previousiloc, previousival);
        iloc = peakTrackSimple.location,
          ival = peakTrackSimple.value,
          iphase = peakTrackSimple.phase,
          previousiloc = peakTrackSimple.previousLocation,
          previousival = peakTrackSimple.previousValue,
          distminindex = peakTrackSimple.distanceMinIndex
        // console.log(peakTrackSimple)
      }


      //savings
      previousival = ival.slice();
      previousiloc = iloc.slice();
      // console.log(previousival)
      // console.log(previousiloc)

      var tempSineFreq = []
      for (var i = 0; i < iloc.length; i++) {
        tempSineFreq[i] = math.max((iloc[i]) / N * SR, 0.0);
      }

      for (var n = 0; n < SineFreq.length; n++) {
        SineFreq[n][pin / n1] = tempSineFreq[n];
      }

      // Frequency of the partials
      var tempSineAmp = []
      for (var i = 0; i < iloc.length; i++) {
        tempSineAmp[i] = math.max(ival[i], MinMag);
      }

      for (var n = 0; n < SineAmp.length; n++) {
        SineAmp[n][pin / n1] = tempSineAmp[n];
      }

      for (var i = 0; i < nSines; i++) {
        syniloc[i] = math.max(1, iloc[i]);
        synival[i] = ival[i];
      }
      // console.log(syniloc)
      // console.log(synival)

      nSynSines = nSines;

      //--- increment loop indexes
      pin = pin + n1;
      pout = pout + n2;
      // console.log("frame  " + (pin / n1));

      postMessage({
        type: 'progress',
        payload: pin / n1,
        maxCount: counterMax
      });
    }
    console.log("C'est fini");
    var analysisData = {
      frametime: frametime,
      sineFrequency: SineFreq,
      sineAmplification: SineAmp,
      frames: counterMax,
      numSines: nSines
    };
    return analysisData;
  }

}