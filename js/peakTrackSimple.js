function PeakTrackSimple(nSines, nPeaks, N, SR, pitchvalue, iftloc, iftval, iftphase, isHarm, previousiloc, previousival) {

    //==> simplest partial tracking
    // data:
    // iloc,ival,iphase: location (bin), magnitude and phase of peaks (current frame)
    // previousiloc,previousival,previousiphase: idem forprevious frame
    // iftloc, iftval, iftphase: idem of all of the peaks in the FT
    // distminindex: indexes of the minimum distance between iloc and iftloc
    // nPeaks: number of peaks detected
    // nSines: number of peaks tracked
    // N: size of the FFT
    // SR: sampling rate
    // pitchvalue: estimated pitch value
    // isHarm: indicator of harmonicity

    var tmpharm = pitchvalue; // --- temporary harmonic
    var ilocPTS = math.zeros([nSines]);
    var MindB = -100;
    var ivalPTS = math.add(math.zeros([nSines]), MindB);
    var iphasePTS = math.zeros([nSines]);
    var distminindex = math.zeros([nSines]);
    var Delta = 0.01;

    var distminval;
    var distminindex;
    var dist = [];
    
    var ind =[];
    var index;

    // console.log("isHarm = " + isHarm)
    // console.log("tmpharm = " + tmpharm)
    // console.log("pitchvalue = " + pitchvalue)
    // 
    // console.log(ivalPTS)
    
    for (var n = 0; n < nSines; n++) {// for each sinus detected
      if (isHarm==1) { // for a harmonic sound
        for (var i = 0; i < iftloc.length; i++) {
          ind[i]=(math.abs((iftloc[i]-1)/N*SR-tmpharm));
        }
        closestpeakindex=indexOfMin(ind);
        tmpharm = tmpharm + pitchvalue;
      }else { // for an inharmonic sound
        for (var i = 0; i < iftloc.length; i++) {
          ind[i]=math.abs(iftloc[i]-previousiloc[n]);
        }
        closestpeakindex=indexOfMin(ind)
      }

      ilocPTS[n] = iftloc[closestpeakindex]; // --- bin of the closest
      ivalPTS[n] = iftval[closestpeakindex];
      iphasePTS[n] = iftphase[closestpeakindex];
      
      for (var i = 0; i < iftloc.length; i++) {
        dist[i]=math.abs(previousiloc[n]-ilocPTS[i]);
      }
      
      distminindex[n] = indexOfMin(dist)
    }
        
        var peakTrackSimple = {
            location: ilocPTS,
            value: ivalPTS,
            phase: iphasePTS,
            previousLocation: previousiloc,
            previousValue: previousival,
            distanceMinIndex: distminindex
        }
        // console.log(peakTrackSimple)

        return peakTrackSimple;
    }