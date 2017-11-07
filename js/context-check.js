var isAudioContextSupported = function () {
    // This feature is still prefixed in Safari
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if(window.AudioContext){
        return true;
    }
    else {
        return false;
    }
};

var audio_context;
if(isAudioContextSupported()) {
    audio_context = new window.AudioContext();    
}
