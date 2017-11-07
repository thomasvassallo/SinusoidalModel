function unwrap2Pi(arg) {
    // ==> unwrapping of the phase, in [-pi, pi]
    // arg: phase to unwrap

    arg = math.subtract(arg, math.multiply(math.multiply(math.floor(math.divide(math.divide(arg, 2), Math.PI)), 2), Math.PI));
    
    var condition = math.zeros([arg.length]);
    for (n = 0; n < arg.length; n++) {
        if (arg[n] >= Math.PI) {
            condition[n] = 1;
        } else {
            condition[n] = 0;
        }
    }

    argunwrap = math.subtract(arg, math.multiply(math.multiply(condition, 2), Math.PI));

    return argunwrap;

}


function unwrap2PiSing(arg){
  var cond = 0;
  arg = arg - math.floor(arg/2/Math.PI)*2*Math.PI;
  if (arg>=Math.PI) {
    cond = 1;
  }
  argunwrap = arg-(cond)*2*Math.PI;
  return(argunwrap);
}