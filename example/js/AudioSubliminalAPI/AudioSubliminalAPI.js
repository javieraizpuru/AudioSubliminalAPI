class AudioDevice {

  constructor(id) {

    /// Create style element for removing the scrollbar with class scrollbarHidden

    let scrollbarHidden = d3.select(document.createElement('style'));
    scrollbarHidden.node().type = 'text/css';
    scrollbarHidden.node().innerHTML = '.ASAPI_scrollbarHidden{scrollbar-width: none; -ms-overflow-style: none;} .ASAPI_scrollbarHidden::-webkit-scrollbar { display: none }';
    d3.select('head').append(() => scrollbarHidden.node());

    /// Set overflow hidden to our container object
    this._container = d3.select("#".concat(id))
      .append('div')
      .attr('class', ' ASAPI_AudioDeviceContainer')
      .style('height', '100%')
      .style('overflow-x', 'hidden')
      .style('overflow-y', 'hidden')
      .style('position', 'relative');

    this._multiplier = 1;

    /// Container width
    this._width = this._container.node().offsetWidth;

    /// Container width
    this._height = this._container.node().offsetHeight;

    /// Default Background colour
    this._backgroundColour = 'white';

    /// Default wave colour
    this._waveColour = 'rgb(153, 153, 153)';

    /// Default playhead colour
    this._playheadColour = 'black';

    /// Default width of wave bars
    this._barWidth = 1;

    /// Default gap between wave bars
    this._barGap = 1;

    /// Default type (waveform or bar)
    this._type = 'waveform';

    this._mainWaveform = d3.select(document.createElement('div'))
      .attr('class', 'ASAPI_MainWaveform')
      .attr('class', 'ASAPI_scrollbarHidden')
      .style('height', '100%')
      .style('width', '100%')
      .style('overflow-x', 'scroll')
      .style('overflow-y', 'hidden')
      .style('position', 'absolute');

    this._container.append(() => this._mainWaveform.node());

    return this;

  }

  _prepareAudio() {
    this._ctx = new(window.AudioContext || window.webkitAudioContext);
    this._output = this._ctx.createGain();
    this._output.connect(this._ctx.destination);
  }

  _isReady(func) {
    if (!this._ready) {
      this._prepareAudio();
      this._ready = true;
    }

    func();
  }

  _dataFilter(data, pixels, saveMode = false) {
    var pixelLength = Math.round(data.length / pixels);

    var vals = [];

    var sampleSize = pixelLength;

    // For each pixel we display
    for (var i = 0; i < pixels; i++) {
      var posSum = 0,
        negSum = 0;

      // Cycle through the data-points relevant to the pixel
      // Don't cycle through more than sampleSize frames per pixel.
      for (var j = 0; j < sampleSize; j++) {
        var val = data[i * pixelLength + j];

        // Keep track of positive and negative values separately
        if (val > 0) {
          posSum += val;
        } else {
          negSum += val;
        }
      }

      if (saveMode) {
        vals.push(2 * posSum / sampleSize);
        vals.push(2 * negSum / sampleSize);
      } else {
        vals.push([negSum / sampleSize, posSum / sampleSize]);
      }

    }
    return vals;
  }

  setVolume(level) {
    this._isReady(() => {
      this._output.gain.linearRampToValueAtTime(level, 0.2);
    });
  }

  height(value) {
    this._multiplier = value;
    return this;
  }

  waveformColour(color) {
    this._waveColour = color;
    return this;
  }

  backgroundColour(color) {
    this._backgroundColour = color;
    this._container.style('background', color);
    return this;
  }

  playheadColour(color) {
    this._playheadColour = color;
    return this;
  }

  barWidth(width) {
    this._barWidth = width;
    return this;
  }

  barGap(gap) {
    this._gap = gap;
    return this;
  }

  type(type) {
    if (type == 'bar') {
      this._type = 'bar';
      this._gap = 1;
    } else {
      this._type = 'waveform'
      this._gap = 0;
    }

    return this;
  }

  meter(id, fill, bg) {

    const container = d3.select("#".concat(id))
    .append('div')
    .style('height', '100%')
    .attr('position', 'relative')
    .attr('class', 'ASAPI_MeterContainer');

    this._meter = container.append('canvas')
    .style('height', '100%')
    .style('width', '100%')

    this._meter.node().width = 20;
    this._meter.node().height = 200;

    let context = this._meter.node().getContext('2d');

    const width = this._meter.node().offsetWidth;
    const height = this._meter.node().offsetHeight;


    context.fillStyle = bg;
    context.rect(0, 0, width, height);
    context.fill();

    this._meterBackground = bg;
    this._meterFill = fill;
    this._meterEnabled = true;

    return this;
  }

}

class AudioPlayer extends AudioDevice {

  static create(container) {
    return new AudioPlayer(container);
  }

  constructor(container) {
    super(container);
    this._sleep = false;
    this._sleepStarted = false;
    this._secondaryColor = 'black';
    this._audioElement = d3.select(document.createElement("audio"));
    this._altAudioElement = d3.select(document.createElement("audio"));
    this._mainWaveform.on('click', () => {
      this._seekPosition(d3.mouse(this._mainWaveform.node())[0])
    });

    window.addEventListener('resize', () => {
      this._reloadWaveform();
    });

    this._secondaryWaveform = d3.select(document.createElement('div'))
      .style('height', '100%')
      .style('width', '0px')
      .style('position', 'absolute')
      .style('border-right', '1px solid #111')
      .style('z-index', '3')
      .style('overflow', 'hidden');
    this._secondaryWaveform.on('click', () => {
      this._seekPosition(d3.mouse(this._secondaryWaveform.node())[0]);
    });


    this._container.append(() => this._secondaryWaveform.node());
    this._container.append(() => this._audioElement.node())
    this._container.append(() => this._altAudioElement.node())

    this.alt.load = (url) => {
      if (this.alt._isPlaying) {
        this.alt.stop();
      }
      this._altAudioElement.node().src = url;
      this._altAudioElement.node().loop = true;
    }

    this.alt.play = () => {
      this._altAudioElement.node().play();
      this.alt._isPlaying = true;
    }

    this.alt.togglePlay = () => {
      if (this.alt._isPlaying) {
        this.alt.stop();
      } else {
        this.alt.play();
      }
    };

    this.alt.stop = () => {
      this._altAudioElement.node().pause();
      this.alt._isPlaying = false;
    }

    this.alt.setVolume = (level) => {
      this._isReady(() => {
        this._altOutput.gain.linearRampToValueAtTime(level, 0.2);
      });
    }

    this.alt.isPlaying = () => {
      return this.alt._isPlaying;
    }
  }

  _prepareAudio() {
    super._prepareAudio();
    this._isPlaying = false;
    this.alt._isPlaying = false;
    this._source = this._ctx.createMediaElementSource(this._audioElement.node());
    this._altSource = this._ctx.createMediaElementSource(this._altAudioElement.node());
    this._splitter = this._ctx.createChannelSplitter(2);
    this._source.connect(this._splitter);
    this._altOutput = this._ctx.createGain();
    this._altSource.connect(this._altOutput);
    this._altOutput.connect(this._ctx.destination);

    if (this._meterEnabled) {
      this._meterAnalyser = this._ctx.createAnalyser();
      this._output.connect(this._meterAnalyser);

      let bufferLength = this._meterAnalyser.frequencyBinCount;
      this._meterAnalyser.fftsize = 2048;
      this._meterAnalyser.smoothingTimeConstant = 1;
      this._analyserData = new Float32Array(bufferLength);
      this._meterAnalyser.getFloatTimeDomainData(this._analyserData);
    }

    this._chooseSource();
  }

  _getPixelPosition(position) {
    this._duration = this._audioElement.node().duration;
    return position * this._duration / this._width;
  }

  _seekPosition(position) {
    let pos = (position == 0) ? 0 : this._getPixelPosition(position);

    this._audioElement.node().currentTime = pos;

    this._secondaryWaveform.style('width', position + 'px');

  }

  _createWaveform(url) {

    let recWidth = (this._type == 'bar') ? this._barWidth : 1;
    let gap = (this._type == 'bar') ? this._gap : 0;
    let space = recWidth + gap;
    let height = this._height;
    let wfHeight = height * this._multiplier;

    const _drawWaveform = (buffer, isSecondary, isSubliminal) => {

      let fill = isSecondary ? this._secondaryColor : this._waveColour;
      let wave = isSecondary ? this._secondaryWaveform : this._mainWaveform;

      const _drawCanvas = (canvas) => {

        if (this._context == null) {

          this._context = canvas.node().getContext("2d");
          this._dataCanvas = d3.select(document.createElement('canvas'));
          this._dataCanvas.attr('height', canvas.attr("height"));

        }
        //Create Custom element
        let bufferContainer = d3.select(document.createElement('custom'));

        //Bind audio data to a rect element inside the custom container
        let dataBinding = bufferContainer.selectAll("custom.rect")
          .data(buffer);


        const getContext = () => {
          return this._context;
        }

        const getdataCanvas = () => {
          return this._dataCanvas.node();
        }


        dataBinding.enter()
          .append("custom")
          .classed("rect", true)
          .attr('x', (d, i) => {
            return i * space;
          })
          .attr('y', function(d, i) {
            return (height / 2) - (wfHeight * d[1]);
          })
          .attr('width', recWidth)
          .attr('height', function(d) {
            return wfHeight * (d[1] - d[0]);
          })
          .attr('fillStyle', fill)

        //Create waveform
        let context = canvas.node().getContext("2d");
        context.fillStyle = this._backgroundColour;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        let elements = bufferContainer.selectAll('custom.rect');

        elements.each(function(d, i, c) {
          let node = d3.select(this);
          context.beginPath();
          context.fillStyle = node.attr("fillStyle");
          context.rect(node.attr("x"), node.attr("y"), node.attr("width"), node.attr("height"));
          context.fill();
          context.closePath();
        });

      }

      let canvas = wave.append("canvas")
        .attr('width', this._width)
        .attr('height', height)
        .style('position', 'absolute')

      if (isSubliminal) {
        canvas.attr('class', 'ASAPI_SubliminalWaveform');
      }
      else {
        canvas.attr('class', 'ASAPI_Waveform');
      }

      _drawCanvas(canvas);

    }

    let lBuffer = this._dataFilter(url[0], this._width / (recWidth + gap));

    let rBuffer = this._dataFilter(url[1], this._width / (recWidth + gap));

    _drawWaveform(lBuffer, false, false);
    _drawWaveform(rBuffer, false, true);
    _drawWaveform(lBuffer, true, false);
    _drawWaveform(rBuffer, true, true);

  }

  _reloadWaveform() {
    this._mainWaveform.selectAll('canvas').remove();
    this._secondaryWaveform.selectAll('canvas').remove();
    this._height = this._container.node().offsetHeight;
    this._width = this._container.node().offsetWidth;

    if (typeof this._waveform !== 'undefined') {
      this._createWaveform(this._waveform);
    }
  }

  _stopPlayhead() {
    this._audioElement.node().pause();
    this._isPlaying = false;
  }

  _startPlayhead() {

    this._audioElement.node().play();
    this._isPlaying = true;

    const _startAnimation = () => {

      this._duration = this._audioElement.node().duration;

      this._playhead = requestAnimationFrame(_startAnimation);

      if (this._isPlaying) {

        let currentTime = this._audioElement.node().currentTime;
        let pos = (currentTime * this._width) / this._duration;

        this._secondaryWaveform.style('width', pos + 'px');

      }
      if (this._meterEnabled) {

        let normalized;
        let db;

        if (this._isPlaying) {

          this._meterAnalyser.getFloatTimeDomainData(this._analyserData);
          let sum = 0;
          this._analyserData.forEach((item, i) => {
            sum += Math.sqrt(Math.abs(item));
          });

          let mean = (sum / this._analyserData.length);

          if (mean > this._lastMean) {
            db = 10 * Math.log10(mean);

          } else {
            db = (10 * Math.log10(this._lastMean)) - 1;
          }

          normalized = (db + 30) / 30;

          this._lastMean = mean;
        } else {
          db = (10 * Math.log10(this._lastMean)) - 1;
          normalized = (db + 30) / 30;
          this._lastMean = Math.pow(10, (db / 10));

          if (db < -60) {
            cancelAnimationFrame(this._playhead);
          }
        }

        let context = this._meter.node().getContext('2d');

        const width = parseInt(this._meter.attr('width'));
        const height = parseInt(this._meter.attr('height'));

        context.fillStyle = this._backgroundColour;
        context.fillRect(0, 0, width, height);
        context.fillStyle = this._meterFill;
        context.fillRect(0, height * (1 - normalized), width, height * normalized);

      }

    }

    _startAnimation();
  }

  _chooseSource(bool) {
    this._splitter.disconnect();
    if (bool) {
      this._splitter.connect(this._output, 1)
    } else {
      this._splitter.connect(this._output, 0)

    }
  }

  load(url, json) {

    this._seekPosition(0);
    this.stop();

    this._audioElement.attr("src", url);
    this._audioElement.node().loop = true;
    this._mainWaveform.selectAll('canvas').remove();
    this._secondaryWaveform.selectAll('canvas').remove();
    this._waveform = json;
    this._createWaveform(json);
  }

  alt() {

  }

  play() {
    this._isReady(this._startPlayhead.bind(this));
  }

  togglePlay() {
    this._isReady(() => {
      if (this._isPlaying) {
        this.stop();
      } else {
        {
          this.play();
        }
      }

    });
  }

  stop() {
    const func = this._stopPlayhead();
  }

  waveformColour(fill, bg) {
    super.waveformColour(fill);
    if (bg != null) {
      this._secondaryColor = bg;
    }
    return this;
  }

  playheadColour(color) {
    this._playheadColour = color;
    this._secondaryWaveform.style('border-right', '1px solid '.concat(this._playheadColour));
    return this;
  }

  listenSubliminal(bool) {
    this._isReady(() => {
      this._chooseSource(bool)
    });
  }

  getOutputNode() {
    if (this._output == null) {
      this._isReady();
    }
    return this._output;
  }

  getAudioContext() {
    // if (this._ctx === null) {
    //   this._isReady(() => {});
    // }

    return this._ctx;
  }

  isPlaying() {
    return this._isPlaying;
  }

}

class AudioRecorder extends AudioDevice {

/// Returns a new AudioRecorder object
  static create(container, libraryPath) {
    return new AudioRecorder(container, libraryPath);
  }

/// Set direction from right to left in the constructor
  constructor(container, libraryPath) {
    super(container);
    this._libraryPath = libraryPath;
    this._mainWaveform.style('direction', 'rtl');
    return this;
  }

/// Private functions

  _createWaveform(url) {
    let recWidth = (this._type == 'bar') ? this._barWidth : 1;
    let gap = (this._type == 'bar') ? this._gap : 0;
    let space = recWidth + gap;
    let height = this._height;
    let wfHeight = height * this._multiplier;

    const _drawWaveform = (buffer, isSecondary) => {

      let fill = this._waveColour;
      let wave = this._mainWaveform;

      const _drawCanvas = (canvas) => {

        if (this._context == null) {
          this._context = canvas.node().getContext("2d");
        }
        //Create Custom element

        if (this._dataContainer == null) {
          this._dataContainer = document.createElement('custom');
          this._dataCanvas = d3.select(document.createElement('canvas'));
          this._dataCanvas.attr('height', canvas.attr("height"));
        }

        let bufferContainer = d3.select(this._dataContainer);

        //Bind audio data to a rect element inside the custom container

        let dataBinding = bufferContainer.selectAll("custom.rect")
          .data(buffer);


        const getContext = () => {
          return this._context;
        }

        const getdataCanvas = () => {
          return this._dataCanvas.node();
        }


        dataBinding.enter()
          .append("custom")
          .classed("rect", true)
          .attr('x', (d, i) => {
            return i * space;
          })
          .attr('y', function(d, i) {
            return (height / 2) - (wfHeight * d[1]);
          })
          .attr('width', recWidth)
          .attr('height', function(d) {
            return wfHeight * (d[1] - d[0]);
          })
          .attr('fillStyle', fill)
          .call(data => {
            let context = getContext();
            context.fillStyle = this._backgroundColour;
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            data.each((function(d, i) {
              let node = d3.select(this);
              context.drawImage(getdataCanvas(), 0, 0);
              context.beginPath();
              context.fillStyle = node.attr("fillStyle");
              context.rect(node.attr("x"), node.attr("y"), node.attr("width"), node.attr("height"));
              context.fill();
              context.closePath();
            }));

            this._dataCanvas.attr('width', canvas.attr("width"));

            let dataCanvas = getdataCanvas().getContext('2d');
            dataCanvas.drawImage(canvas.node(), 0, 0);

            return data;
          });
      }

      let width = url.length * space;
      if (this._canvas == null) {
        this._canvas = wave.append("canvas")
          .attr('width', width)
          .attr('height', this._height)
          .style('border-right', '1px solid '.concat(this._playheadColour))
      } else {
        this._canvas.attr('width', width)
      }

      _drawCanvas(this._canvas);


    }

    _drawWaveform(url, false);
  }

  _normalizeData(buffer) {
    let data = buffer;

    //Getting max value from array
    // let max = Math.max.apply(null, data);

    const getMax = (d) => {
      let maxValue = Number.MIN_VALUE;

      d.forEach((item, i) => {
        maxValue = (item > maxValue) ? item : maxValue;
      });

      return maxValue;
    }

    const max = getMax(data);

    //Normalize using max as reference
    data.forEach((item, i) => {
      if (item != 0) {
        data[i] = item / max;
      }
    });
    return data;
  }

  _getWaveform(buffer) {

    let vals = [];

    const lBuffer = this._dataFilter(this._normalizeData(buffer.getChannelData(0)), 1920, true);
    const rBuffer = this._dataFilter(this._normalizeData(buffer.getChannelData(1)), 1920, true);
    vals.push(lBuffer);
    vals.push(rBuffer);

    const json = JSON.stringify(vals);

    return json;

  }

  _stopRecording() {

    if (this._mediaRecorder != null && this._mediaRecorder.isRecording())
    {
      this._mediaRecorder.finishRecording();

      this._stream.getTracks().forEach((i) => {
        i.stop();
      });

      this._data = [];

      this._ctx.suspend();

      this._dataCanvas.remove();

      this._dataContainer = null;

      this._dataCanvas = null;

      this._canvas == null;

      return false;

    }

    return true;
  }

  _startRecording() {

    this._isReady(() =>
    {
      /// Resume Context
      this._ctx.resume();
      navigator.mediaDevices.getUserMedia({audio: true})
      .then((stream) =>
      {
        /// We got a stream from the micrphone

        // INIT DATA
        this._recordingTime = 0;
        this._currentTime = new Date();
        Tone.setContext(this._ctx);
        this._stream = stream;

        // This is our source stream
        const source = this._ctx.createMediaStreamSource(stream);

        this.merger = this._ctx.createChannelMerger(2);

        let analyser = this._ctx.createAnalyser();

        let modulationNode = this._ctx.createGain();

        let modulator = new Tone.Tremolo(17000, 1);

        let hpf = new Tone.Filter(16000, 'highpass', -48);

        modulator.spread = 0;

        Tone.connect(source, modulationNode);

        Tone.connect(modulationNode, modulator);

        modulator.connect(hpf);

        hpf.connect(this.merger, 0, 1);

        source.connect(this.merger, 0, 0);

        source.connect(analyser);

        this._mediaRecorder = new WebAudioRecorder(this.merger, {
          workerDir: this._libraryPath,
          encoding: "wav"
        });

        /// Start modulating the second output
        modulator.start();

        /// Start Recording
        this._mediaRecorder.startRecording();

        analyser.fftSize = 2048;

        let bufferLength = analyser.frequencyBinCount;

        let dataArray = new Float32Array(bufferLength);

        analyser.getFloatTimeDomainData(dataArray);

        /// INIT DATA POINTS
        this._data = [];

        this._lastMean = 0;

        //// Our draw function
        const draw = () =>
        {

          this._drawVisual = requestAnimationFrame(draw);

          analyser.getFloatTimeDomainData(dataArray);

          if (this._mediaRecorder.isRecording())
          {

            let currentTime = new Date();

            this._recordingTime = currentTime - this._currentTime;

            let b = this._dataFilter(dataArray, ~~(dataArray.length / 512));

            for (let i of b)
              this._data.push(i);

            this._createWaveform(this._data);

          }
          const drawMeter = () =>
          {

            let normalized = 1;
            let db;

            if (this._mediaRecorder.isRecording()) {

              let sum = 0;
              dataArray.forEach((item, i) => {
                sum += Math.sqrt(Math.abs(item));
              });

              let mean = (sum / dataArray.length);

              if (mean > this._lastMean) {
                db = (10 * Math.log10(this._lastMean) + 0.5);
                this._lastMean = mean;
              } else {
                db = (10 * Math.log10(this._lastMean)) - 0.5;
                this._lastMean = Math.pow(10, (db / 10));
              }

            } else {
              db = (10 * Math.log10(this._lastMean)) - 1;
              this._lastMean = Math.pow(10, (db / 10));

              if (db < -60) {
                cancelAnimationFrame(this._drawVisual);
              }
            }

            normalized = (db + 30) / 30;

            let context = this._meter.node().getContext('2d');

            const width = parseInt(this._meter.attr('width'));
            const height = parseInt(this._meter.attr('height'));

            context.fillStyle = this._meterBackground;
            context.fillRect(0, 0, width, height);
            context.fillStyle = this._meterFill;
            context.fillRect(0, height * ( 1 - normalized) , width, height * normalized);
          }

          if (this._meter != null)
          {
            drawMeter();
          }
        }

        draw();

        this._mediaRecorder.onComplete = (rec, e) =>
        {
          const process = (buffer) => {
            this._ctx.decodeAudioData(buffer)
              .then(data => {
                this.getRecordingData(e, this._getWaveform(data));
              });
          }

          if (typeof e.arrayBuffer === 'function')
            e.arrayBuffer().then(buffer => process(buffer));
          else
          {

            const blobReader = new FileReader();
            blobReader.onload = (e) =>
            {
              const buffer = e.target.result;
              process(buffer);
            }

            blobReader.readAsArrayBuffer(e);
          };
        };

      });
    });

  }

///Public functions

  stop() {
    const func = this._stopRecording;
  }

  record() {
    if (this._stopRecording()) {
      this._startRecording();
    }
  }

  isRecording() {
    if (this._mediaRecorder != null) {
      return this._mediaRecorder.isRecording();
    }

    return false;

  }

  getRecordingData() {

  };

  getRecordingTime() {
    if (this._recordingTime == null) {
      this._recordingTime = 0;
    }
    return this._recordingTime;
  }
}

export {
  AudioPlayer,
  AudioRecorder
};
