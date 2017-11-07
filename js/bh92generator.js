// function bh92SINE2SINEgeneration(bh92SINE2SINE, bh92SINE2SINEsize) {
//     // generation of the Blackman-Harris window
//     // output data:
//     // bh92SINE2SINEsize: size of the window
//     // bh92SINE2SINE: (sampled) window
//     var bh92SINE2SINEsize = 4096;
//     var bh92SINE2SINE = math.zeros([bh92SINE2SINEsize]);
//     var bh92const = [0.35875, 0.48829, 0.14128, 0.01168];
//     var aux = 2 * math.PI / (bh92SINE2SINEsize - 1);
// 
//     for (i = 0; i < bh92SINE2SINEsize; i++) {
//         bh92SINE2SINE[i] = bh92const[0] - bh92const[1] * math.cos(i * aux) + bh92const[2] * math.cos(i * 2 * aux) - bh92const[3] * math.cos(i * 3 * aux)
//     }
//     console.log(bh92SINE2SINE)
//     return bh92SINE2SINE;
// }

function bh92SINE2SINEgeneration(bh92SINE2SINE, bh92SINE2SINEsize) {
  var bh92SINE2SINEsize = 4096;
  var bh92SINE2SINE = math.zeros([bh92SINE2SINEsize]);
  var bh92SINE2SINEOUT = math.zeros([bh92SINE2SINEsize]);
  var bh92const = [0.35875, 0.48829, 0.14128, 0.01168];
  var bh92N = 512;
  var bh92Theta = -4 * 2 * Math.PI / bh92N;
  var bh92ThetaIncr = 8 * 2 * Math.PI / bh92N / bh92SINE2SINEsize;

  for (var i = 0; i < bh92SINE2SINEsize; i++) {
    for (var m = 0; m < 3; m++) {
      bh92SINE2SINE[i] = bh92SINE2SINE[i] - bh92const[m] / 2 * (sine2sine(bh92Theta - m * 2 * Math.PI / bh92N, bh92N) + sine2sine(bh92Theta + m * 2 * Math.PI / bh92N, bh92N));
    }
    bh92Theta = bh92Theta + bh92ThetaIncr;
  }

  for (var i = 0; i < bh92SINE2SINE.length; i++) {
    bh92SINE2SINEOUT[i] = bh92SINE2SINE[i] / bh92SINE2SINE[bh92SINE2SINEsize / 2]
  }
  return bh92SINE2SINEOUT;
}

function sine2sine(x, N) {
  x = Math.sin((N / 2) * x) / Math.sin(x / 2);
  return x;
}