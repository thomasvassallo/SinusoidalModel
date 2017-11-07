function InterpolatedValues(r, phi, N, zp, ftloc, ftval) {

    // function [iftloc, iftphase, iftval] = interpolatedValues ...
    // (r, phi, N, zp, ftloc, ftval)

    // ==> calculatus of the interpolated values of location (bin),
    //  phase and magnitude by cubic interpolation
    //  data:
    //  iftloc: interpolated location (bin)
    //  iftval: interpolated magnitude
    //  iftphase: interpolated phase
    //  ftloc: peak locations (bin)
    //  ftval: peak magnitudes
    //  r: modulus of the FFT
    //  phi: phase of the FFT
    //  N: size of the FFT
    //  zp: zero-padding multiplicative coefficient


    //--- calculate interpolated peak position in bins (iftloc) ------
    var lvCondLeft1 = math.zeros([ftloc.length]);
    var lvCondLeft2 = math.zeros([ftloc.length]);
    var lvIndLeft = ftloc.slice();
    var leftftval = [];

    for (n = 0; n < ftloc.length; n++) {
        if (lvIndLeft[n] > 0) {
            lvCondLeft1[n] = 1;
        } else {
            lvCondLeft1[n] = 0;
        }
        if (lvIndLeft[n] <= 0) {
            lvCondLeft2[n] = 1;
        } else {
            lvCondLeft2[n] = 0;
        }
    }

    var leftValIndexVector = math.add(math.dotMultiply(lvIndLeft, lvCondLeft1), math.dotMultiply(lvCondLeft2, 1));
    leftValIndexVector = math.subtract(leftValIndexVector, 1);
    for (x = 0; x < leftValIndexVector.length; x++) {
        leftftval.push(math.subset(r, math.index(leftValIndexVector[x])));
    }

    var lvCondRight1 = math.zeros([ftloc.length]);
    var lvCondRight2 = math.zeros([ftloc.length]);
    var lvIndRight = math.add(ftloc, 2);
    var rightftval = [];

    for (n = 0; n < ftloc.length; n++) {
        if (lvIndRight[n] < N / 2) {
            lvCondRight1[n] = 1;
        } else {
            lvCondRight1[n] = 0;
        }
        if (lvIndRight[n] >= N / 2) {
            lvCondRight2[n] = 1;
        } else {
            lvCondRight2[n] = 0;
        }
    }

    var rightValIndexVector = math.add(math.dotMultiply(lvIndRight, lvCondRight1), math.dotMultiply(lvCondRight2, N / 2))
    rightValIndexVector = math.subtract(rightValIndexVector, 1);
    for (x = 0; x < rightValIndexVector.length; x++) {
        rightftval.push(math.subset(r, math.index(rightValIndexVector[x])));
    }

    leftftval = math.multiply(math.log10(leftftval), 20);
    rightftval = math.multiply(math.log10(rightftval), 20);

    ftval = math.multiply(math.log10(ftval), 20);
    var iftloc = [];
    for (var i = 0; i < ftloc.length; i++) {
        iftloc[i] = ftloc[i] + .5 * (leftftval[i] - rightftval[i]) / (leftftval[i] - 2 * ftval[i] + rightftval[i]);
    }

    iftloc = math.add(iftloc, 1);

    // --- interpolated ftloc -----------------------------------------
    var condition1 = math.zeros([iftloc.length]);
    for (n = 0; n < iftloc.length; n++) {
        if (iftloc[n] >= 1) {
            condition1[n] = 1;
        } else {
            condition1[n] = 0;
        }
    }

    var condition2 = math.zeros([iftloc.length]);
    for (n = 0; n < iftloc.length; n++) {
        if (iftloc[n] < 1) {
            condition2[n] = 1;
        } else {
            condition2[n] = 0;
        }
    }

    for (var i = 0; i < iftloc.length; i++) {
        iftloc[i] = condition1[i] * iftloc[i] + condition2[i] * 1;
    }


    var condition1 = math.zeros([iftloc.length]);
    for (n = 0; n < iftloc.length; n++) {
        if (iftloc[n] > (N / 2) + 1) {
            condition1[n] = 1;
        } else {
            condition1[n] = 0;
        }
    }

    var condition2 = math.zeros([iftloc.length]);
    for (n = 0; n < iftloc.length; n++) {
        if (iftloc[n] <= (N / 2) + 1) {
            condition2[n] = 1;
        } else {
            condition2[n] = 0;
        }
    }

    for (var i = 0; i < iftloc.length; i++) {
        iftloc[i] = condition1[i] * (zp / 2 + 1) + condition2[i] * iftloc[i];
        iftloc[i] = iftloc[i] - 1;
    }

    // --- calculate interpolated phase (iphase) ----------------------


    var leftftphase = [];
    var rightftphase = [];
    var intpfactor = [];
    var iftphase = [];
    var diffphase = [];
    var condition3;
    var condition4;

    for (var i = 0; i < iftloc.length; i++) {
        leftftphase[i] = phi[math.floor(iftloc[i])];
        rightftphase[i] = phi[math.floor(iftloc[i] + 1)];
    }


    for (var i = 0; i < iftloc.length; i++) {
        intpfactor[i] = iftloc[i] - ftloc[i];
    }

    for (var i = 0; i < intpfactor.length; i++) {
        if (intpfactor[i] > 0) {
            condition3 = 1;
        } else {
            condition3 = 0;
        }
        if (intpfactor[i] < 0) {
            condition4 = 1;
        } else {
            condition4 = 0;
        }
        intpfactor[i] = condition3 * intpfactor[i] + condition4 * (1 + intpfactor[i]);
    }

    for (var i = 0; i < rightftphase.length; i++) {
      diffphase[i]=unwrap2PiSing(rightftphase[i]-leftftphase[i]);
    }
    // diffphase = unwrap2Pi(math.subtract(rightftphase, leftftphase));

    for (var i = 0; i < iftloc.length; i++) {
        iftphase[i] = leftftphase[i] + intpfactor[i] * diffphase[i];
    }
    
    //--- calculate interpolate amplitude (iftval) -------------------

    var iftval = [];
    for (var i = 0; i < ftval.length; i++) {
      iftval[i] = ftval[i]-0.25*(leftftval[i]-rightftval[i])*(iftloc[i]-ftloc[i]);
    }
    
    //Return results
    var interpolatedValues = {
        location: iftloc,
        phase: iftphase,
        value: iftval
    };
    return interpolatedValues;
}