// @file
// Main app.
// @flow

const Howler = require('howler');

// Enable mobile playback whenever.
Howler.mobileAutoEnable = false;

import ObjectAssign from 'object-assign';
import classManip from './class-manip';

const defaultSoundConfig = {
  rate: 1,
  loop: false,
  stereo: 0
};

const enablePerformance = false;

let buttons = [],
buttonsDown = {},
sounds = {},
soundsDefaultConfig = {},
soundSrc,
soundConf,
button,
i;

// Handles UI control.
const UiControl = {
  // Get a button for given soundSrc.
  button: function(soundSrc: string): ?HTMLElement {
    return document.querySelector('.button[data-src="' + soundSrc + '"]');
  },

  // Set default disabled state.
  disableButton: function(button: HTMLElement): void {
    button.setAttribute('disabled', 'disabled');
  },

  // Enable button once sound is loaded.
  enableButton: function(button: HTMLElement): void {
    button.removeAttribute('disabled');
  },

  // Add mousedown button event.
  initButtonEvent: function(button: HTMLElement): void {
    button.addEventListener('mousedown', buttonDown, false);
  },

  // Register which button has been clicked.
  // Add it to the list of buttons that are down.
  // Start tracking movement.
  getButtonDown: function(e: Event): void {
    var soundSrc = e.target.getAttribute('data-src');
    classManip.addClass(e.target, 'button--down');
    buttonsDown[soundSrc] = {
      touch: 0,
      pos: {
        x: e.clientX,
        y: e.clientY
      }
    };
  },

  // Identify the soundSrc used for the button released.
  getButtonUpSoundSrc: function(e: Event): ?string {
    var soundSrc = null;
    // @TODO: determine touch ID from event.
    var touchID = 0;

    var touchedSoundSrcs = Object.keys(buttonsDown).filter(function(s) {
      return buttonsDown[s].touch == touchID;
    });
    if (!touchedSoundSrcs.length) {
      return null;
    }
    soundSrc = touchedSoundSrcs[0];
    return soundSrc;
  },

  // Handle button up behaviour.
  // Reset classes,
  // calculate drag state,
  // release global touch state,
  // and return anything needed for performance.
  handleButtonUp: function(soundSrc: string, elem: HTMLElement, e: Event): object {
    // Disable the down state on the button.
    classManip.removeClass(elem, 'button--down');

    // Calculate the drag used to handle live performance.
    var xDrag = e.clientX - buttonsDown[soundSrc].pos.x;
    var yDrag = e.clientY - buttonsDown[soundSrc].pos.y;

    // Reset buttonsDown state.
    delete buttonsDown[soundSrc];

    return {
      xDrag: xDrag,
      yDrag: yDrag
    };
  },

  // Toggle play class display.
  togglePlayClass: function(elem, playing) {
    if (playing) {
      classManip.addClass(elem, 'button--playing');
    }
    else {
      classManip.removeClass(elem, 'button--playing');
    }
  }
};

// Handles playback. Resets config after stopping a sound.
const SoundControl = {
  // Load configuration and init Howler.
  loadConfig: function(soundSrc: string, dataConfig: string): void {
    var soundConf = JSON.parse(atob(dataConfig));
    if (!soundConf) {
      soundConf = {};
    }

    // Set up default config.
    let defaultConfig = ObjectAssign({}, defaultSoundConfig);
    soundsDefaultConfig[soundSrc] = ObjectAssign(defaultConfig, soundConf);

    // Create howl-specific config and init Howler.
    let config = {
      src: [soundSrc],
      autoplay: false,
      onload: howlerLoad,
      onend: howlerEnd
    };
    config = ObjectAssign(config, soundsDefaultConfig[soundSrc]);
    sounds[soundSrc] = new Howler.Howl(config);
  },

  // Play sound with preferences.
  play: function(soundSrc: string, options: Object): void {
    console.log(options);
    if (options.hasOwnProperty('rate')) {
      sounds[soundSrc].rate(options.rate);
    }
    if (options.hasOwnProperty('pan')) {
      sounds[soundSrc].stereo(options.pan);
    }
    sounds[soundSrc].play();
  },

  // Stop playing and reset state.
  stop: function(soundSrc: string): void {
    sounds[soundSrc].stop();
    sounds[soundSrc].rate(soundsDefaultConfig[soundSrc].rate);
    sounds[soundSrc].loop(soundsDefaultConfig[soundSrc].loop);
    sounds[soundSrc].stereo(0);
  },

  // Determine properties of a given sound.
  soundIs: function(soundSrc: string, prop: string): boolean {
    var howl = sounds[soundSrc];
    if (prop == 'loop') {
      return howl._loop;
    }
    if (prop == 'playing') {
      return howl.playing();
    }
    return false;
  }
};

// Event on Howler load.
const howlerLoad = function(): void {
  UiControl.enableButton(UiControl.button(this._src));
};

// When a howler sound has finished playing, disable the button.
const howlerEnd = function(): void {
  // Since this in current context is for the howler object,
  // we just check _loop for this and not bother checking the config.
  if (!this._loop) {
    var elem = UiControl.button(this._src);
    SoundControl.stop(this._src);
    UiControl.togglePlayClass(elem, false);
  }
};

// Button down:
// Register which button has been clicked.
// Add it to the list of buttons that are down.
// Start tracking movement.
const buttonDown = function(e: Event): void {
  e.preventDefault();
  UiControl.getButtonDown(e);
};

// Button up:
// End tracking movement.
// Deteremine target pitch/volume based on direction of drag.
// Play sound.
const buttonUp = function(e: Event): void {
  var soundSrc = UiControl.getButtonUpSoundSrc(e);
  var elem = UiControl.button(soundSrc);
  var performance = UiControl.handleButtonUp(soundSrc, elem, e);

  // Now, we actually do something with this button.
  var howl = sounds[soundSrc];

  // If it's looping and already playing, we stop it.
  if (
    SoundControl.soundIs(soundSrc, 'loop') &&
    SoundControl.soundIs(soundSrc, 'playing')
  ) {
    SoundControl.stop(soundSrc);
    UiControl.togglePlayClass(elem, false);
  }
  // Otherwise, we play it.
  else {
    // Determine performance behaviour.
    let playConfig = {};
    if (Math.abs(performance.yDrag) > 100) {
      playConfig.rate = (
        performance.yDrag > 0 ?
        0.5 :
        2
      ) * soundsDefaultConfig[soundSrc].rate;
      if (playConfig.rate < 0.5) {
        playConfig.rate = 0.5;
      }
      if (playConfig.rate > 4) {
        playConfig.rate = 4;
      }
    }
    if (Math.abs(performance.xDrag) > 100) {
      playConfig.pan = (
        performance.xDrag > 0 ?
        1 :
        -1
      );
    }

    SoundControl.play(soundSrc, playConfig);
    UiControl.togglePlayClass(elem, true);
  }
};

// Window load: set up sounds and buttons.
let onReady = function(e: Event): void {
  if (enablePerformance) {
    classManip.addClass(document.querySelector('body'), 'with-performance');
  }

  buttons = document.querySelectorAll('.button[data-src]');
  for (i = 0; i < buttons.length; i++) {
    button = buttons[i];
    UiControl.disableButton(button);
    soundSrc = button.getAttribute('data-src');

    SoundControl.loadConfig(soundSrc, button.getAttribute('data-config'));
    UiControl.initButtonEvent(button);
  }
  document.addEventListener('mouseup', buttonUp, false);
};

window.addEventListener('DOMContentLoaded', onReady);
