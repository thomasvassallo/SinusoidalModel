function CreateNewTrack(iftloc, iftval, previousiloc, previousival, nSines, MinMag) {

// ==> creation of a new track by looking for a new significant
//  peak not already tracked
//  data: iftlov, iftval: bin number & magnitude of peaks detected
//  previousiloc,
//  previousival: idem for previous peaks detected
//  nSines: number of sines
//  MinMag: minimum magnitude (-100 dB) for
//  0 amplitude

var min = [];
var ind = [];  
var index;
var tempIftval = iftval.slice();

//--- removing peaks already tracked

for (var n = 0; n < nSines; n++) {
  for (var i = 0; i < tempIftval.length; i++) {
    ind[i] = tempIftval[i]-previousival[n];
  }
  index=indexOfMin(math.abs(ind))
  tempIftval[index] = MinMag;
}

  //--- keeping the maximum
  var newival = math.max(tempIftval);
  var ind = indexOfMax(tempIftval)
  newiloc = iftloc[ind];
  
  var createNewTrack = {
      value: newival,
      location: newiloc
  };
  
  return createNewTrack;
}