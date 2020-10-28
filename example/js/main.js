/// Import our audio recorder and our audio player from the API
import {
  AudioRecorder,
  AudioPlayer
} from '/js/AudioSubliminalAPI/AudioSubliminalAPI.js'

import AudioMotionAnalyzer from '/js/AudioSubliminalAPI/libs/audioMotion-analyzer.js';


///////////////////////////////////////////////////////////////
/// Audio recorder code ///
///////////////////////////////////////////////////////////////

/// Create our recorder in the element with id myRecorder
const myRecorder = AudioRecorder.create('myRecorder', 'js/AudioSubliminalAPI/libs/');

/// Visual settings of our recorder
myRecorder.backgroundColour('white') // Setting background colour
          .waveformColour('grey') // Setting waveform colour
          .type('bar')  // Create waveform using rectangles
          .barWidth(4) // Rectangles width
          .height(1)   // Change wave height

/// Create our recorder level meter  element with id recorderMeter
myRecorder.meter('recorderMeter',
                 'grey',  // Colour of our meter
                 'white'); // background colour of our meter

/// Setting the callback that will be called after finishing the recording
/// In this callback we can upload our block (our .wav file) and our waveform visual data
myRecorder.getRecordingData = (blob, json) =>  {

  var formData = new FormData();
  formData.append('waveform', json);
  formData.append('recording', blob);

  $.ajax({
    url: '/upload',
    data: formData,
    processData: false,
    contentType: false,
    type: 'POST',
  }).then(() => {
    loadWaveform();
  });
};

/// Setting record button
var recordButton = document.getElementById('recordButton');

/// Start or stop recording when clicking the record button
recordButton.addEventListener('click', function() {

  /// Change button text when we start or stop recording
  if (myRecorder.isRecording()) {
      recordButton.innerHTML = 'Record';
    }
  else {
    recordButton.innerHTML = 'Stop';
  }

  /// Start or stop recording
  myRecorder.record(); /// If we're recording the record will stop
                      /// and the callback will be executed
});

///////////////////////////////////////////////////////////////
/// Audio Player code ///
///////////////////////////////////////////////////////////////

/// Create our player in the element with id myPlayer
const myPlayer = AudioPlayer.create("myPlayer");

/// Setting player options
myPlayer.backgroundColour("white")
        .waveformColour("grey", "red")
        .playheadColour('red')
        .type('bar')
        .barWidth(4)
        .barGap(1)
        .height(3)

/// Loading background music file
myPlayer.alt.load('/audios/background/background.wav');

/// Setting play button

var playButton = document.getElementById('playButton');

playButton.addEventListener('click', () =>
{
  myPlayer.togglePlay();

  if (myPlayer.isPlaying()) {
    playButton.innerHTML = 'Stop';
    }
  else {
    playButton.innerHTML = 'Play';
  }

  loadAnalyser();
});

/// Setting background music play button

var bgPlayButton = document.getElementById('bgPlayButton');

bgPlayButton.addEventListener('click', () => {
  myPlayer.alt.togglePlay();

  if (myPlayer.alt.isPlaying()) {
    bgPlayButton.innerHTML = 'Stop';
    }
  else {
    bgPlayButton.innerHTML = 'Play';
  }
});

/// Setting Play button volume Controller

var playVolume = document.getElementById('playerVolume');

playVolume.addEventListener('input', () =>
{
  let newVolume = playVolume.value;
  myPlayer.setVolume(newVolume); //MAX = 1, Min = 0;
})

/// Setting background music play button volume Controller

var bgPlayVolume = document.getElementById('bgPlayerVolume');

bgPlayVolume.addEventListener('input', () =>
{
  let newVolume = bgPlayVolume.value;
  myPlayer.alt.setVolume(newVolume);
})

/// Setting enabling subliminal button

var toggleSubliminalButton = document.getElementById('toggleSubliminal');

var isSubliminalEnable = false;

toggleSubliminalButton.addEventListener('click', () =>
{
  isSubliminalEnable = !isSubliminalEnable;

  myPlayer.listenSubliminal(isSubliminalEnable); /// Toggle subliminal

  /// Changing button text
  if (isSubliminalEnable) {
      toggleSubliminalButton.innerHTML = 'Listen original';
    }
  else {
    toggleSubliminalButton.innerHTML = 'Listen subliminal';
  }

});

//// Load our waveform data from the server
function loadWaveform()
{
  $.ajax({
    url: 'audios/waveform.json',
    method: 'GET'
  }).then((data)  => {
    /// After ajax loads the json data we load the audio and waveform
    myPlayer.load('/audios/blob.wav', data);
    loadAnalyser();
  });
}

loadWaveform();

///////////////////////////////////////////////////////////////
/// Audio analyser ///
///////////////////////////////////////////////////////////////

function loadAnalyser()
{
  /// Add Analyser
  const ctx = myPlayer.getAudioContext();
  const myAnalyser = document.getElementById('myAnalyser');

  //Clear previous analyser if exist
  myAnalyser.innerHTML = "";

  const ama =  new AudioMotionAnalyzer(myAnalyser , {
    audioCtx: ctx
    });

  myPlayer.getOutputNode().connect(ama.analyzer);
}
