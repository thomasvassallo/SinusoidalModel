function PickPeaks(spectrum, nPeaks, minspace) {
    //peaking the nPicks highest peaks in the given spectrum from the greater to the lowest data:
    // loc: bin number of peaks (if loc(i)==0, no peak detected)
    // val: amplitude of the given spectrum
    // spectrum: spectrum (abs(fft(signal)) 
    // nPicks: number of peaks to pick
    // minspace: minimum of space between two peaks

    var c = 1; //vector dinemsion hard coded (dimension of spectrum)
    
    var r = math.size(spectrum);
    var r = math.subset(r, math.index(0));
    var rmin = math.min(spectrum) - 1;
    var rMinArr = [rmin];
    var iloc = [];
    var ival = [];
    var ind = [];
    var condition = [];
    var tempIval = [];
    var tempIloc = [];
    // ---find a peak, zero out the data around the peak, and repeat
    val = math.multiply(math.ones([nPeaks]), -100);
    loc = math.zeros([nPeaks]);

    // --- find all local peaks
    for (k = 0; k < c; k++) {

        var difference = math.concat(rMinArr, spectrum, 0);
        var difference = math.concat(difference, rMinArr, 0);
        for (i = 0; i < difference.length; i++) {
            difference[i] = difference[i + 1] - difference[i]
        }
        difference = math.subset(difference, math.index(math.range(0, difference.length-2, true)));

        condition1 = math.subset(difference, math.index(math.range(0, r - 1, true)));
        condition2 = math.subset(difference, math.index(math.range(1, r, true)));

        for (j = 0; j < condition1.length; j++) {
            if (condition1[j] >= 0 && condition2[j] <= 0) {
                iloc.push(j);
            }
        }
        // peak values
        for (x = 0; x < iloc.length; x++) {
            ival.push(math.subset(spectrum, math.index(iloc[x])));
        }
        

        for (p = 0; p < nPeaks; p++) { //change 1 to nPeaks
            var l = indexOfMax(ival);

            // save value and location
            val[p] = ival[l];
            loc[p] = iloc[l];

            ind=[];
            for (n = 0; n < iloc.length; n++) {
                condition[n] = iloc[l] - iloc[n];
                condition[n] = math.abs(condition[n]);
                //find peaks which are far away
                if (condition[n] > minspace) {
                    ind.push(n);
                }
            }

            // no more local peaks to pick
            if (!ind.length) {
                break;
            }
            
            
            for (var i = 0; i < ind.length; i++) {
              tempIval[i]=ival[ind[i]];
              tempIloc[i]=iloc[ind[i]];
            }
            ival=tempIval.slice();
            iloc=tempIloc.slice();
        }
        
        var pickedPeaks = {
            value: val,
            location: loc
        };

        return pickedPeaks;
    }
}