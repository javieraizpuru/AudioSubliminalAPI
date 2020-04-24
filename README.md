# AudioSubliminalAPI

## Installation
The AudioSubliminalApi used D3.js and Tone.js as depedencies:

https://github.com/d3/d3
and https://github.com/Tonejs/Tone.js

After adding this libraries you can add the AudioSubliminalAPI at the end of the body element.

`<script src="AudioSubliminalAPI.js"></script>`

##How it works

The AudioSubliminalAPI has two components: the audio recorder and the audio player.

The audio recorder will record the user input and create an audio file that will contain both the original audio and the subliminal audio.
It will also create a JSON string that contains the audio waveform data.

The audio player can decode this audio file and play the original audio or the subliminal. It will use the JSON waveform data to draw the audio waveform.

## Creating audio Player / Recorder:

This will create an audio player / recorder canvas inside the #myContainer element with the default settings.

``` 
const myPlayer = AudioPlayer.create("#myPlayerContainer");

const myRecorder = AudioRecorder.create("#myRecorderContainer");
```

## Recording Audio and getting Data

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

`myPlayer.load('/path/to/my/audio.ogg', myJsonStringWaveform);`

Load an audio file for the background music

`myPlayer.alt.load('/path/to/my/MyBackgroundMusic.ogg');`

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
  .fill('white', 'gray')                    // Waveform fill color, the second option is the waveform color after it has being played.
  .playhead('gray')                         //Playhead color (the line that moves while playing)
  .height(3)                                //Height multipler
  .background('#111')                       //Background color 
  .meter('#playerMeter', '#00e600', '#111'); //Enable meter, first option is the meter container, second is the meter color and third is the background color

const myRecorder = AudioRecorder.create("#myRecorderContainer")
  .type('bar')
  .fill('#00e600')
  .playhead('white')
  .background('#111')
  .meter('#recMeter', '#00e600', #111);
  ```



