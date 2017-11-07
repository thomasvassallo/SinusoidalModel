function SineFillSpectrum(iloc, ival, iphase, nSines, w1Length, zp, bh92SINE2SINE, bh92SINE2SINEsize) {
    // => compute the spectrum of all the sines in the frequency
    //  domain, in order to remove it from the signal
    //  data:
    //  padsynth:
    //  iloc, ival, iphase: location (bin), magnitude value (dB)
    //  and phase of a peak
    //  nSines: number of sines (=length of ival and iloc)
    //  w1Length: size of the analysis window
    //  zp: zero-padding multiplicative coefficient
    //  bh92SINE2SINE: Blackman-Harris window
    //  bh92SINE2SINEsize: Blackman-Harris window size


    var peakmag = [];
    var firstbin = [];
    var firstbin2 = [];
    var binremainder = [];
    var sinphase = [];
    var cosphase = [];
    var findex = [];
    var magsin = [];
    var magcos = [];
    var beginindex;
    var increment;
    var limitindex;

    for (var i = 0; i < ival.length; i++) {
        peakmag[i] = Math.pow(10, ival[i] / 20)
    }

    var halflobe = 8 * zp / 2 - 1; // bin number of the half lobe

    for (var i = 0; i < iloc.length; i++) {
        firstbin[i] = Math.floor(iloc[i]) - halflobe; // first bin for filling positive frequencies -- one off index (need to confirm if correct)
        firstbin2[i] = Math.floor(w1Length * zp - iloc[i]) - halflobe; // two off, due to difference in firstbin (+2 looks suspicious)
        binremainder[i] = iloc[i] - Math.floor(iloc[i]);
        sinphase[i] = Math.sin(iphase[i]);
        cosphase[i] = Math.cos(iphase[i]);
        findex[i] = 1 - binremainder[i];
    }

    var bh92SINE2SINEindexes = math.zeros([8 * zp]);
    var sinepadsynthft = math.zeros([w1Length * zp + halflobe + halflobe + 1]);
    var padsynthft = math.zeros([w1Length * zp]);

    for (var i = 0; i < nSines; i++) {
        if (iloc[i] != 0) {
            // Tracked sines
            beginindex = math.floor(0.5 + findex[i] * 512 / zp);
            increment = 512 / zp;
            limitindex = beginindex + 512 / zp * (8 * zp - 1);

            for (var n = 0; n < limitindex / increment; n++) {
                bh92SINE2SINEindexes[n] = beginindex + (increment * n);
            }

            if (bh92SINE2SINEindexes[8 * zp - 1] > bh92SINE2SINEsize) {
                bh92SINE2SINEindexes[8 * zp - 1] = bh92SINE2SINEsize;
            }

            for (var n = 0; n < bh92SINE2SINEindexes.length; n++) {
                magsin[n] = bh92SINE2SINE[bh92SINE2SINEindexes[n]] * (sinphase[i] * peakmag[i]);
                magcos[n] = bh92SINE2SINE[bh92SINE2SINEindexes[n]] * cosphase[i] * peakmag[i];
            }

            //--- fill positive frequency            
            var compSFSpos = [];
            for (var n = 0; n < magcos.length; n++) {
                var inputReal = magcos[n];
                var inputImags = magsin[n]
                compSFSpos[n] = math.complex(inputReal, inputImags);
            }
            var posSeg = math.subset(sinepadsynthft, math.index(math.range(firstbin[i] + halflobe, firstbin[i] + halflobe + 8 * zp - 1, true)));
            var posSFSSeg = math.add(compSFSpos, posSeg);

            for (var n = 0; n < posSFSSeg.length; n++) {
                sinepadsynthft[n + firstbin[i] + halflobe] = posSFSSeg[n];
            }

            if (firstbin2[i] + halflobe <= w1Length * zp)
                //--- fill Negative frequency            
                var compSFSneg = [];
            for (var n = 0; n < magcos.length; n++) {
                var inputReal = magcos[n];
                var inputImags = -math.abs(magsin[n]);
                compSFSneg[n] = math.complex(inputReal, inputImags);
            }

            var negSeg = math.subset(sinepadsynthft, math.index(math.range(firstbin2[i] + halflobe, firstbin2[i] + halflobe + 8 * zp - 1, true)));
            var negSFSSeg = math.add(compSFSneg, negSeg);

            for (var n = 0; n < negSFSSeg.length; n++) {
                sinepadsynthft[n + firstbin2[i] + halflobe] = negSFSSeg[n];
            }
        }
    }

    //--- fill padsynthft
    for (var n = 0; n < padsynthft.length; n++) {
        padsynthft[n] = math.add(padsynthft[n], sinepadsynthft[n + halflobe]);
    }

    var subset1 = math.subset(padsynthft, math.index(math.range(0, halflobe - 1, true)));
    var subset2 = math.subset(sinepadsynthft, math.index(math.range(w1Length * zp, w1Length * zp + halflobe - 1, true)));
    for (var n = 0; n < halflobe; n++) {
        padsynthft[n] = math.add(subset1[n], subset2[n]);
    }

    var subset3 = math.subset(padsynthft, math.index(math.range(w1Length * zp - halflobe, w1Length * zp - 1, true)));
    var subset4 = math.subset(sinepadsynthft, math.index(math.range(0, halflobe - 1 - 1, true)));
    for (var n = 0; n < ((w1Length * zp - 1) - (w1Length * zp - halflobe)); n++) {
        padsynthft[n + w1Length * zp - halflobe] = math.add(subset3[n], subset4[n]);
    }

    return padsynthft;
}