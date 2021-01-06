# AudioSubliminalAPI
## Installation
The AudioSubliminalApi used D3.js, Tone.js and web-audio-recorder-js as depedencies. (Included inside the lib folder)

After adding this libraries you can add the AudioSubliminalAPI at the start of your script using the import statement.

Import both the AudioPlayer and the Audio Recorder: 
```
import {
  AudioPlayer,
  AudioRecorder
} from 'AudioSubliminalAPI.js'
```

Import only the AudioPlayer:

```
import {
  AudioPlayer
} from 'AudioSubliminalAPI.js'
```

Import only the AudioRecorder:

```
import {
  AudioRecorder
} from 'AudioSubliminalAPI.js'
```

##How it works

The AudioSubliminalAPI has two components: the audio recorder and the audio player.

The audio recorder will record the user input and create an audio file that will contain both the original audio and the subliminal audio.
It will also create a JSON string that contains the audio waveform data.

The audio player can decode this audio file and play the original audio or the subliminal. It will use the JSON waveform data to draw the audio waveform.

## Creating audio player/recorder:

This will create an audio player canvas inside the #myContainer element with the default settings.

``` 
const myPlayer = AudioPlayer.create("#myPlayerContainer");


For the recorder you also have to specify the path to the folder where the web-audio-recorder-js library is located

const myRecorder = AudioRecorder.create("#myRecorderContainer", "js/libs/');
```

## Recording audio and getting data

You have to define the getRecordingData function to retrieve the audio data and the json waveform. The audio data is retreived as a Blob and the json as a string. The audio blob can be stored as a .WAV file. 

``` 
myRecorder.getRecordingData = (blob, json) => {
  myUpload(blob, json);
};
```
After defining the getRecordingData you are ready to record.

`myRecorder.record()`

If you use the record() function while recording it will stop the recording and trigger the getRecordingData function that we previously defined.

## Using the audio player

Load an audio and JSON waveform:

`myPlayer.load('/path/to/my/audio.wav', myJsonStringWaveform);`

Load an audio file for the background music

`myPlayer.alt.load('/path/to/my/MyBackgroundMusic.wav');`

Play / Stop / PlayStop 

```
myPlayer.play()
myPlayer.alt.play() //Play background music

myPlayer.stop()
myPlayer.alt.stop() //Stop background music

myPlayer.playStop()
myPlayer.alt.playStop() //Play/Stop background music
```

Set Volume

```
myPlayer.setVolume(1) // Set the volume, maximum is 1 (default) minimum 0

myPlayer.alt.setVolume(1) // setting the volume to the background music

```

Listen to subliminal or original recording.

```
myPlayer.setSubliminal(true) //Listen to subliminal recording

myPlayer.setSubliminal(false) //Listen to originial recording

```
# Styling recorder/player and adding input meter

You can edit how the recorder/player looks while creating it.
```
const myPlayer = AudioPlayer.create("#myPlayerContainer")
  .type('bar')                              //Create waveform using rectangles
  .barWidth(2)                              //rectangles width
  .waveformColour('white', 'gray')                    // Waveform fill color, the second option is the waveform color after it has being played.
  .playheadColour('gray')                         //Playhead color (the line that moves while playing)
  .height(3)                                //Height multipler
  .backgroundColour('#111')                       //Background color 
  .meter('#playerMeter', '#00e600', '#111'); //Enable meter, first option is the meter container, second is the meter color and third is the background color

const myRecorder = AudioRecorder.create("#myRecorderContainer")
  .type('bar')
  .waveformColour('#00e600')
  .playheadColour('white')
  .backgroundColour('#111')
  .meter('#recMeter', '#00e600', #111);
  ```

# Connecting to AudioMotionAnalyzer lib

https://github.com/hvianna/audioMotion-analyzer

To connect it to the AudioMotionAnalyzer lib to an audio player you just have to use the audio context from the AudioSubliminalAPI in the AudioMotionAnalyzer constructor. The AudioSubliminalAPI creates the audio context after the first time it loads a file. So you have to first load an audio file to get the audio context. After loading a file for the first time you can connect the audio player node to the analyser. 

```
const ctx = myPlayer.getContext();
const container = document.getElementById("analyser");
    
const motionAnalyser = new AudioMotionAnalyzer(container , {
  audioCtx: ctx
  });

myPlayer.getOutputNode().connect(motionAnalyser.analyzer);

```


