/*
 * TTS Reader Core
 *
 * This file contains TTS Reader core functions
 *
 * @package		TTS Reader
 * @category	Core
 * @author		SkechBoy, Dongseong Hwang
 * @link		https://github.com/ds-hwang/TTSReader
 */

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Defining main background variables
 * ---------------------------------------------------------------------------------------------------------------------
 */
var i = 0, words = 0, audio = [];
var current = 0;
var debug = true;    // make this true if you want to debug TTS Reader
var state = 'ready'; // curent playing state (playing OR paused)
var reloaded = [], datastack = [], textstack = '';
var google_tts =
    'http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&client=speakit&prev=input&tl=';
var google_tts_name = "Google TTS";
var options = JSON.parse(localStorage.getItem("options"));
/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get current version
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Set default options
 * ---------------------------------------------------------------------------------------------------------------------
 */
(function() {
if (options == null ||
    options.version === undefined) // notify users for version update
{
  voice = (options != null && options.voice !== undefined)
              ? options.voice
              : 'Google US English';

  vupdate = (options == null ? "installed" : "updated");

  options = {
    voice : voice,
    version : getVersion(),
    volume : 0.5,
    rate : 1.0,
    pitch : 1.0,
    context : true,
    logo : true,
    speechinput : false,
    collect : true,
    hotkeys : "ctrl + shift + 83" // Ctrl+Shift+S default kb shortcut
  }

            localStorage.setItem("options", JSON.stringify(options));
  options = JSON.parse(localStorage.getItem("options"));
}

chrome.runtime.onInstalled.addListener(function(status) {
  switch (status.reason) {
  case 'install':
    chrome.tabs.create({url : chrome.extension.getURL('options.html')});
    break;
  }
});
})();

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * This function is called onload in the popup code
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getSelection() {
  // Injects the content script into the current opened tab and all iframes
  chrome.tabs.executeScript(null,
                            {file : 'js/get_selection.js', allFrames : true});
};

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Play audio
 * ---------------------------------------------------------------------------------------------------------------------
 */
function playAudio(channel, data, first, firstdata) {
  current = channel;
  nextchannel = channel ? 0 : 1;
  if (first) {
    audio[channel].src = firstdata;
  }
  audio[channel].play();

  options = JSON.parse(localStorage.getItem("options"));
  setAudioOptions(options);
  preloadAudio(nextchannel, data);
  words--;
  updateNumber(words);
  if (debug)
    console.log('Play channel: ' + channel);
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Preloading next audio so the pause between 2 sentences is minimal
 * ---------------------------------------------------------------------------------------------------------------------
 */
function preloadAudio(channel, data) {
  if (data.search(/&q=undefined/i) == -1) // removing undefined bug :)
  {
    if (debug)
      console.log('Preloading audio in channel: ' + channel);
    datastack[channel] = data;
    audio[channel].src = data;
    audio[channel].preload = true;
    reloaded[channel] = 1;
  }
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Playback functions for controlling audio
 * ---------------------------------------------------------------------------------------------------------------------
 */
function pauseAudio() // Pause Audio
{
  state = 'paused';
  if (options.voice == google_tts_name) {
    if (audio[current])
      audio[current].pause(); // pause current audio channel
    if (debug)
      console.log('Audio channel: ' + current + ' was paused.');
  } else {
    chrome.tts.pause();
  }
}

function resumeAudio() // resume paused audio
{
  options = JSON.parse(localStorage.getItem("options")); // must fix!
  if (options.voice == google_tts_name) {
    if (audio[current] !== undefined) // stupid bug but i'll fix that :)
    {
      state = 'playing';
      audio[current].play(); // resume paused audio channel
      if (debug)
        console.log('Audio channel: ' + current + ' was resumed.');
    }
  } else {
    state = 'playing';
    chrome.tts.resume();
  }
}

function replayAudio() // replay audio
{
  options = JSON.parse(localStorage.getItem("options")); // must fix
  if (options.voice == google_tts_name) {
    ttsRead(filterText(textstack));
  } else {
    TTS_Speak(textstack, false);
  }
}

function setAudioOptions(options) // set volume
{
  if (debug)
    console.log('Audio sets volume to' + parseFloat(options.volume) +
                ' and rate to' + parseFloat(options.rate) + '%');
  if (audio[0] !== undefined) {
    audio[0].volume =
        parseFloat(options.volume); // Set volume on bouth channels
    audio[1].volume = parseFloat(options.volume);
    audio[0].playbackRate = parseFloat(options.rate);
    audio[1].playbackRate = parseFloat(options.rate);
  }
}

function showReplay() // shows replay button in popup.html
{
  state = 'replay';
  // current = undefined;
  var popups = chrome.extension.getViews({type : "popup"});
  if (popups.length != 0) {
    var popup = popups[0];
    popup.sendState(state);
  } else {
    state = 'ready';
  }
}

function sendDuration(channel) // Send audio duration to popup.html
{
  var popups = chrome.extension.getViews({type : "popup"});
  if (popups.length != 0) {
    var popup = popups[0];
    popup.displayProgress(audio[channel].duration);
    if (debug)
      console.log('Duration of audio in channel ' + channel +
                  ' was sent. It is: ' + audio[channel].duration + ' seconds');
  }
}

function nowPlaying() // Display current audio state
{
  var popups = chrome.extension.getViews({type : "popup"});
  if (popups.length != 0) {
    var popup = popups[0];
    popup.sendState(state);
  }
}

function getState() // Return current audio state
{
  return state;
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Error handling functions
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleError(channel) {
  console.log('Error in channel: ' + channel);
  reloadAudio(channel);
}

function reloadAudio(channel) {
  if (reloaded[channel] <= 3) {
    console.log('Reloading channel: ' + channel);
    audio[channel].src = datastack[channel];
    audio[channel].preload = true;
    reloaded[channel]++;
  } else {
    readingProblems();
  }
}

function readingProblems() // displays reading problems notification in popup
{
  pauseAudio();
  var popups = chrome.extension.getViews({type : "popup"});
  if (popups.length != 0) {
    var popup = popups[0];
    popup.showError();
  }
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * On context menu click function
 * ---------------------------------------------------------------------------------------------------------------------
 */
function contextMenu(selection) {
  options = JSON.parse(localStorage.getItem("options")); // must fix
  if (state != 'playing') {
    if (state == 'ready') {
      if (options.voice == google_tts_name) {
        ttsRead(filterText(selection.selectionText.toString()));
      } else {
        TTS_Speak(selection.selectionText.toString(), true);
      }
      textstack = selection.selectionText.toString();
    } else {
      resumeAudio();
    }
  } else {
    pauseAudio();
  }
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Create context Menu
 * ---------------------------------------------------------------------------------------------------------------------
 */
if (options.context) {
  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    "title" : google_tts_name,
    "contexts" : [ "selection" ],
    "onclick" : contextMenu
  });
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Perform the callback when a request is received from the content script
 * ---------------------------------------------------------------------------------------------------------------------
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  options = JSON.parse(localStorage.getItem("options")); // must fix
  if (request.method === undefined) {
    if (request.text != undefined) {
      text = filterText(request.text); // get selected and formated text
      if (state == 'playing') {
        var popups = chrome.extension.getViews({type : "popup"});
        if (popups.length == 0) {
          pauseAudio();
        }
      } else {
        if (state == 'paused') {
          resumeAudio();
        } else {
          if (text.length && text[0] != '') {
            if (options.voice == google_tts_name) {
              nowPlaying();
              ttsRead(text);
            } else {
              TTS_Speak(request.text, true);
            }
          }
        }
      }
      textstack = request.text;
    }
  } else {
    sendResponse({options : JSON.parse(localStorage.getItem("options"))});
  }
});

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * TTS Reader core function - Use It Wisely :) :)
 * ---------------------------------------------------------------------------------------------------------------------
 */
function ttsRead(text) {
  chrome.tabs.detectLanguage(
      null, function(lang) // detect page language
      {
        options = JSON.parse(localStorage.getItem("options"));
        i = 0; // reseting global variables
        current = 0;

        state = 'playing';

        popups = chrome.extension.getViews({type : "popup"});
        if (popups.length != 0) {

          var popup = popups[0];
          popup.sendState(state);
        }

        url = google_tts + lang +
              '&q='; // assemble full url for Google Network TTS API
        words = text.length;

        audio = new Array();
        audio[0] = new Audio(); // defining two new audo objects each time
        audio[1] = new Audio();

        playAudio(i, url + text[i + 1], 1, url + text[i]); // Start first audio

        // Audio event listeners
        audio[0].addEventListener("ended", function() {
          ++i;
          if (i < text.length) {
            playAudio(1, url + text[i + 1], 0, '');
          } else {
            showReplay();
          }
        }, true);

        audio[1].addEventListener("ended", function() {
          ++i;
          if (i < text.length) {
            playAudio(0, url + text[i + 1], 0, '');
          } else {
            showReplay();
          }
        }, true);

        // Send audio duration when audio start to playing
        audio[0].addEventListener("playing", function() { sendDuration(0); });
        audio[1].addEventListener("playing", function() { sendDuration(1); });

        // On audio load error caused by Google bot protection
        audio[0].addEventListener("error", function() { handleError(0); });
        audio[1].addEventListener("error", function() { handleError(1); });

        // On audio load error caused by Google bot protection
        audio[0].addEventListener("staled", function() { handleError(0); });
        audio[1].addEventListener("staled", function() { handleError(1); });
      });
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 *  Speak with new TTS Chrome API
 * ---------------------------------------------------------------------------------------------------------------------
 */
function TTS_Speak(utterance, rp_state) {
  options = JSON.parse(localStorage.getItem("options"));

  if (debug)
    console.log(utterance);

  if (rp_state) {
    nowPlaying();
  }

  tts_options = {
    voiceName : options.voice,
    enqueue : Boolean(false),
    rate : parseFloat(options.rate),
    pitch : parseFloat(options.pitch),
    volume : parseFloat(options.volume),
  };
  tts_options.onEvent = function(event) {
    if (false) {
      text.setSelectionRange(0, event.charIndex);
    }
    if (debug)
      console.log('Event ' + event.type + ' at position ' + event.charIndex);
    if (event.type == 'end' || event.type == 'interrupted' ||
        event.type == 'cancelled' || event.type == 'error') {
      chrome.tts.isSpeaking(function(isSpeaking) {
        if (!isSpeaking) {
          state = 'ready';
        }
      });
    }
  };
  state = 'playing';
  chrome.tts.stop();
  chrome.tts.speak(utterance, tts_options, function() {
    if (chrome.runtime.lastError) {
      console.log('TTS Error: ' + chrome.runtime.lastError.message);
    }
  });
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 *  Function for filtering text from "bad" characters and preppare text for
 * Google Text to Speech API
 * ---------------------------------------------------------------------------------------------------------------------
 */
function split(string, maxlength) {
  var result = [];
  (function(string) {
    var index = string.substring(maxlength).indexOf(" ");
    if (index == -1)
      return string ? result.push(string.split(' ').join('+')) : null;
    result.push(
        string.substring(0, index + maxlength + 1).trim().split(' ').join('+'));
    arguments.callee.call(window, string.substring(index + maxlength + 1));
  })(string);
  return result;
}

function beautify(string) {
  return string.replace(/([+.,])$/, '').replace(/^([+.,])/, '');
}

function filterText(text) {
  var j = 0, str = [], tmpstr = [],
      maxlength = 90, // Max length of one sentence this is Google's fault :)
      badchars =
          [
            "+", "#", "@", "-", "<", ">", "\n", "!", "?", ":", "&", '"', "  ",
            "。", "`"
          ],
      replaces = [
        " plus ", " sharp ", " at ", "", "", "", "", ".", ".", ".", " and ",
        " ", " ", ".", ""
      ];

  for (var i in badchars) // replacing bad chars
  {
    text = text.split(badchars[i]).join(replaces[i]);
  }

  str = text.split(/([.,!?:])/i); // this is where magic happens :) :)

  for (var i in str) // join and group sentences
  {
    if (tmpstr[j] === undefined) {
      tmpstr[j] = '';
    }

    if ((tmpstr[j] + str[i]).length < maxlength) {
      tmpstr[j] = tmpstr[j] + str[i].split(' ').join('+');
    } else {
      tmpstr[j] = beautify(tmpstr[j]);

      if (str[i].length < maxlength) {
        j++;
        tmpstr[j] = beautify(str[i].split(' ').join('+'));
      } else {
        sstr = split(str[i], maxlength);
        for (x in sstr) {
          j++;
          tmpstr[j] = beautify(sstr[x]);
        }
      }
    }
  }
  return tmpstr.filter(String);
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 *  TTS Reader basic TTS engine functions
 * ---------------------------------------------------------------------------------------------------------------------
 */
var speakListener = function(utterance, options, sendTtsEvent) {
  if (debug)
    console.log("speakListener");
  // sendTtsEvent({'event_type': 'start', 'charIndex': 0})
  nowPlaying();
  // sendTtsEvent({'event_type': 'end', 'charIndex': utterance.length})
};

var stopListener = function() {
  if (debug)
    console.log("stopListener");
};

function log(error) {
  if (debug)
    console.log(error);
}

function reload() {
  updateNumber(0);
  window.location.reload();
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 *  Add listeners and register TTS Reader as TTS engine
 * ---------------------------------------------------------------------------------------------------------------------
 */
chrome.ttsEngine.onSpeak.addListener(speakListener);
chrome.ttsEngine.onStop.addListener(stopListener);