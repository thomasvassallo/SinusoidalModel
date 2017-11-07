function TWM(iloc, ival, N, SR) {
    // => Two-way mismatch error pitch detection
    // using Bauchamp & Maher algorithm
    // 
    // data:
    // iloc: location (bin) of the peaks
    // ival: magnitudes of the peaks
    // N: number of peaks
    // SR: sampling rate
    //freq in hz
    var ifreq = math.multiply(math.divide(math.subtract(iloc, 0), N), SR);

    //--- avoid zero frequency peak
    var zindex = indexOfMin(ifreq);
    var zvalue = math.min(ifreq);

    if (zvalue == 0) {
        ival[zindex] = -100;
        ifreq[zindex] = 1;
    }

    var ival2 = ival.slice();

    var MaxLoc1 = indexOfMax(ival2);
    var MaxMag = math.max(ival2)
    ival2[MaxLoc1] = -100;
    var MaxLoc2 = indexOfMax(ival2);
    var MaxMag2 = math.max(ival2)
    ival2[MaxLoc2] = -100;
    var MaxLoc3 = indexOfMax(ival2);
    var MaxMag3 = math.max(ival2)

    //--- pitch candidates
    var nCand = 10; // number of candidates
    var pitchc = math.zeros([3 * nCand]);

    var array = [];
    for (var i = 0; i < nCand; i++) {
        array[i] = i + 1;
    }

    var subset1L = math.multiply(ifreq[MaxLoc1], math.ones([nCand]));
    var subset1R = math.subtract(nCand + 1, array);
    var subset1 = math.dotDivide(subset1L, subset1R)
    pitchc = math.subset(pitchc, math.index(math.range(0, nCand - 1, true)), subset1);

    var subset2L = math.multiply(ifreq[MaxLoc2], math.ones([nCand]));
    var subset2R = math.subtract(nCand + 1, array);
    var subset2 = math.dotDivide(subset2L, subset2R)
    pitchc = math.subset(pitchc, math.index(math.range(nCand, (nCand * 2) - 1, true)), subset2);

    var subset3L = math.multiply(ifreq[MaxLoc3], math.ones([nCand]));
    var subset3R = math.subtract(nCand + 1, array);
    var subset3 = math.dotDivide(subset3L, subset3R)
    pitchc = math.subset(pitchc, math.index(math.range(nCand * 2, (nCand * 3) - 1, true)), subset3);

    var harmonic = pitchc.slice();
    var ErrorPM = math.zeros([harmonic.length]);
    var MaxNPM = math.min(10, iloc.length);

    var difmatrixPM = [];
    var tempMatrix = [];
    var FreqDistance = [];
    var peakloc = [];
    var tempVect1 = [];
    var tempVect2 = [];
    var tempVect3 = [];
    var tempVect4 = [];
    var tempVect5 = [];
    var Ponddif = [];
    var PeakMag = [];
    var MagFactor = [];
    var test = math.ones([harmonic.length, ifreq.length]);

    var ErrorPM = math.zeros([harmonic.length]);
    difmatrixPM = math.ones([harmonic.length, ifreq.length]);
    tempMatrix = math.ones([ifreq.length]);
    tempMatrix2 = math.ones([ifreq.length]);
    FreqDistance = math.zeros([harmonic.length]);
    peakloc = math.zeros([harmonic.length]);

    //--- predicted to measured mismatch error
    for (var i = 0; i < MaxNPM; i++) {

        for (var n = 0; n < difmatrixPM.length; n++) {
            for (var m = 0; m < difmatrixPM[n].length; m++) {
                difmatrixPM[n][m] = harmonic[n] * tempMatrix[n];
            }
        }

        for (var n = 0; n < ifreq.length; n++) {
            for (var m = 0; m < harmonic.length; m++) {
                test[m][n] = ifreq[n] * tempMatrix2[n]
            }
        }

        for (var n = 0; n < difmatrixPM.length; n++) {
            for (var m = 0; m < difmatrixPM[n].length; m++) {
                difmatrixPM[n][m] = math.abs(difmatrixPM[n][m] - test[n][m]);
            }
        }

        for (var n = 0; n < FreqDistance.length; n++) {
            FreqDistance[n] = math.min(difmatrixPM[n])
            peakloc[n] = indexOfMin(difmatrixPM[n])
        }


        for (var n = 0; n < harmonic.length; n++) {
            tempVect1[n] = Math.pow(harmonic[n], -0.5)
            Ponddif[n] = FreqDistance[n] * tempVect1[n]
        }

        for (var n = 0; n < peakloc.length; n++) {
            var index = peakloc[n]
            PeakMag[n] = ival[index];
        }

        // seems to be working up until this point 
        for (var n = 0; n < PeakMag.length; n++) {
            MagFactor[n] = Math.max(0, MaxMag - PeakMag[n] + 20);
            MagFactor[n] = Math.max(0, 1.0 - (MagFactor[n] / 75.0));
        }

        for (var n = 0; n < Ponddif.length; n++) {
            tempVect2[n] = (1.4 * Ponddif[n]) - 0.5;
            tempVect3[n] = MagFactor[n] * tempVect2[n];
            tempVect4[n] = Ponddif[n] + tempVect3[n];
            ErrorPM[n] = ErrorPM[n] + tempVect4[n];
        }

        for (var n = 0; n < harmonic.length; n++) {
            harmonic[n] = harmonic[n] + pitchc[n];
        }
    }

    var ErrorMP = math.zeros([harmonic.length]);
    var MaxNMP = math.min(10, ifreq.length);
    var tempIfreqSeg = [];
    var nharm = [];
    var tempErrorMP = [];
    var cond1;
    var cond2;
    
    // --- measured to predicted mismatch error
    for (var i = 0; i < pitchc.length; i++) { //pitchc.length

        nharm = math.round(math.divide(math.subset(ifreq, math.index(math.range(0, MaxNMP - 1, true))), pitchc[i]));
        for (var n = 0; n < nharm.length; n++) {
            if (nharm[n] >= 1) {
                cond1 = 1;
            } else {
                cond1 = 0;
            }
            if (nharm[n] < 1) {
                cond2 = 1;
            } else {
                cond2 = 0;
            }
            nharm[n] = cond1 * nharm[n] + cond2;
        }
        
        tempIfreqSeg=math.subset(ifreq, math.index(math.range(0, MaxNMP - 1, true)));
        
        for (var n = 0; n < nharm.length; n++) {
          FreqDistance[n] = math.abs(tempIfreqSeg[n] - nharm[n]*pitchc[i]);
        }
        FreqDistance = FreqDistance.slice(0,nharm.length);
        
        
        for (var n = 0; n < FreqDistance.length; n++) {
          Ponddif[n] =FreqDistance[n] * (Math.pow(tempIfreqSeg[n], -0.5));
        }
        Ponddif = Ponddif.slice(0,FreqDistance.length);
        
        var PeakMag = math.subset(ival, math.index(math.range(0, MaxNMP - 1, true)));
        
        for (var n = 0; n < PeakMag.length; n++) {
          MagFactor[n] = math.max(0,MaxMag - PeakMag[n] + 20);
          MagFactor[n] = math.max(0,1.0 - MagFactor[n]/75.0);
        }
        MagFactor = MagFactor.slice(0,PeakMag.length);
        
        for (var n = 0; n < MagFactor.length; n++) {
          tempErrorMP[n] = MagFactor[n]*(Ponddif[n] + MagFactor[n] * ( 1.4 * Ponddif[n] - 0.5));
        }
        
       ErrorMP[i] = math.sum(tempErrorMP);
    }

    var Error = [];
    
    for (var n = 0; n < ErrorPM.length; n++) {
      Error[n] = (ErrorPM[n]/MaxNPM) + (0.3*ErrorMP[n]/MaxNMP);
    }
    var pitcherror = math.min(Error);
    var pitchindex = indexOfMin(Error);
    

    var pitch = pitchc[pitchindex];
    
    var twm = {
      pitch: pitch,
      pitcherror: pitcherror
    };
    
    return twm;
}