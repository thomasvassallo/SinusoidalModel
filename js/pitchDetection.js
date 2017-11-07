function PitchDetection(r, N, SR, nPeaks, iftloc, iftval) {

    // ==> pitch detection function, using the Two-Way Mismatch algorithm (see TWM.m)

    // data:
    // r: FFT magnitude
    // N: size of the FFT
    // SR: sampling rate
    // nPeaks: number of peaks tracked
    // iftloc, iftval: location (bin) and magnitude of the peak
    var pitcherror;
    var pitchvalue;
    // --- harmonicity evaluation of the signal
    var highenergy = math.sum(math.subset(r, math.index(math.range(math.round(5000 / SR * N) - 1, (N / 2) - 1, true))));
    var lowenergy = math.sum(math.subset(r, math.index(math.range(math.round(50 / SR * N) - 1, math.round(2000 / SR * N) - 1, true))));
    //  50 Hz to 2000 Hz
    // isHarm = max(0,(highenergy/lowenergy < 0.6));
    var cond;
    if (highenergy / lowenergy < 0.6) {
        cond = 1;
    } else {
        cond = 0;
    }
    var isHarm = math.max(0, cond);


    // 2-way mismatch pitch estimation when harmonic
    if (isHarm == 1) {
        var npitchpeaks = math.min(50, nPeaks);
        //     [pitchvalue,pitcherror] 
        var twoWayMis = TWM(math.subset(iftloc, math.index(math.range(0, npitchpeaks - 1, true))), math.subset(iftval, math.index(math.range(0, npitchpeaks - 1, true))), N, SR);
        var pitchvalue = twoWayMis.pitch;
        var pitcherror = twoWayMis.pitcherror;
    } else {
        pitchvalue = 0;
        pitcherror = 0;
    }

    // --- in case of two much pitch error,  signal supposed to be inhamonic
    var cond2;
    if (pitcherror <= 1.5) {
        cond2 = 1;
    } else {
        cond2 = 0;
    }
    isHarm = math.min(isHarm, cond2);

    var pitchDetection = {
        value: pitchvalue,
        error: pitcherror,
        isHarmonic: isHarm
    };

    return pitchDetection;
}
