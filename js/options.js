/*
 * TTS Reader Options
 *
 * This file contains user options funcrions
 *
 * @package		TTS Reader
 * @category	Options
 * @author		SkechBoy, Dongseong Hwang
 * @link		https://github.com/ds-hwang/TTSReader
 */
	var element = {},
		bg = chrome.extension.getBackgroundPage(),
		vars = [
					'rate','test', 'rateps', 'irateps', 'pitch', 'voice', 'ivoice', 'volume', 'context', 'speechinput',
					'words', 'iwords', 'lang_voices', 'hotkeys', 'enqueue', 'percents', 'testtext', 'language', 'hotkey',
					'lang_voices', 'irate','options_title', 'app_logo'
				];
/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Create local variables and get their values
 * ---------------------------------------------------------------------------------------------------------------------
*/
	function set_vars(vars)
	{
		for (key in vars)
  		{
  			key = vars[key];
 			if(document.getElementById(key) != null)
 			{
 				element[key] = document.getElementById(key);
 			}
 			else
 			{
 				element[key] = '';
 			}
  		}
	}
/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Initialise Event listeners
 * ---------------------------------------------------------------------------------------------------------------------
*/
function init_listeners()
{
	element.context.addEventListener('click', function() //show that restart is requred
	{
		toggle("contx_info");
		save_options();
	});

	element.test.addEventListener('click', function() //test listener
	{
		set_vars(vars);
		chrome.tts.speak
		(
			document.getElementById("testtext").value,
			{
				voiceName: element.voice.value,
				enqueue: Boolean(element.enqueue.checked),
		        rate: parseFloat(element.rate.value),
				pitch: parseFloat(element.pitch.value),
				volume: parseFloat(element.volume.value/100)
			}
		);
	});

	element.voice.addEventListener('change', function()
	{
		voice_options(this.value);
		save_options();
	});

	element.app_logo.addEventListener('click', function()
	{
		chrome.tabs.create({url: 'http://www.ispeech.org/webapps/speakit'});
	});

	element.pitch.addEventListener('change', function()
	{
		save_options();
	});

	element.enqueue.addEventListener('change', function()
	{
		save_options();
	});

	element.speechinput.addEventListener('change', function()
	{
		save_options();
	});

	element.ivoice.addEventListener('change', function()
	{
		save_options();
	});

	element.lang_voices.addEventListener('click', function()
	{
		// redirect's to Chrome Webstore for new TTS engines
		chrome.tabs.create({url: 'http://goo.gl/dU9tB'});
	});

	element.hotkeys.addEventListener("keydown", function(e){keyDown(e,0);save_options();}, false); // keyboard shortcuts

	element.volume.addEventListener('change', function() // display volume level
	{
		element.percents.innerHTML = parseInt(this.value)+' %';
		save_options();
	}, false);

	element.rate.addEventListener('change', function() // display rate
	{
		element.rateps.innerHTML = 'x'+(parseFloat(this.value)).toFixed(2);
		element.words.innerHTML = Math.round(this.value*200);
		save_options();
	}, false);

	element.irate.addEventListener('change', function() // display irate
	{
		element.irateps.innerHTML = 'x'+parseFloat(this.value);
		element.iwords.innerHTML = (parseInt(this.value)+11)*30;
		save_options();
	}, false);
}
/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Check if Local Storage is avalible
 * ---------------------------------------------------------------------------------------------------------------------
*/
function checkLocalStorage()
{
	if (window.localStorage == null)
	{
		alert("LocalStorage must be enabled for changing options.");
		return false;
	}
	return true;
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get current version
 * ---------------------------------------------------------------------------------------------------------------------
*/
function getVersion()
{
    var details = chrome.app.getDetails();
    return details.version;
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get languages supported by chrome *** experimental feature
 * ---------------------------------------------------------------------------------------------------------------------
*/
function getLanguages(current)
{
	for(langs in languages)
	{
		var opt = document.createElement('option');
		if (languages[langs].language == current)
		{
			opt.setAttribute('selected', 'selected');
		}
		opt.setAttribute('value', languages[langs].language);
		opt.innerText = languages[langs].name;
		language.appendChild(opt);
	}
}
/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Save user defined options
 * ---------------------------------------------------------------------------------------------------------------------
*/
function save_options()
{

	if(!checkLocalStorage()) return;

	bg.reload();

	localStorage.clear();

  	var options =
	{
		version : getVersion(),
		rate :  element.rate.value,
		irate :  element.irate.value,
		voice :  element.voice.value,
		ivoice : element.ivoice.value,
		pitch :  element.pitch.value,
		enqueue :  element.enqueue.checked,
		speechinput : element.speechinput.checked,
		context: element.context.checked,
		hotkeys: element.hotkey,
		volume : parseFloat(element.volume.value/100)
	}

	localStorage.setItem("options", JSON.stringify(options));
	bg.setVolume(parseFloat(element.volume.value/100));
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get user defined options
 * ---------------------------------------------------------------------------------------------------------------------
*/
function restore_options()
{
	options = JSON.parse(localStorage.getItem("options"));
	element.options_title.innerHTML = 'TTS Reader'+_is_update()+' v'+getVersion();
	element.speechinput.checked = options.speechinput;
	element.context.checked = options.context;
	element.enqueue.checked = options.enqueue;
	element.hotkeys.value = getHotkeys(options.hotkeys);
	element.hotkey = options.hotkeys;
	element.rate.value = options.rate;
	element.irate.value = options.irate;
	element.pitch.value = options.pitch;
	element.volume.value = parseInt(options.volume*100);
	element.percents.innerHTML = volume.value+' %';
	element.rateps.innerHTML = 'x'+rate.value
	element.irateps.innerHTML = 'x'+irate.value
	element.words.innerHTML = (200*rate.value).toFixed(0);
	element.iwords.innerHTML = 30*(parseInt(irate.value)+11);
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Show specific voice options
 * ---------------------------------------------------------------------------------------------------------------------
*/
function voice_options(voice)
{
	document.getElementById("moreoptions").style.display = 'none';
	document.getElementById("ispeech").style.display = 'none';

	switch(voice)
	{
		case 'TTS Reader':
			element.testtext.value = chrome.i18n.getMessage('lang_testtext');
  		break;
		case 'iSpeech':
			get_ivoices();
			document.getElementById("ispeech").style.display = 'block';
			element.testtext.value = "This is a test text for Google Chrome extension called TTS Reader";
		break;
		default:
			document.getElementById("moreoptions").style.display = 'block';
			element.testtext.value = "This is a test text for Google Chrome extension called TTS Reader";
	}
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get user defined keyboard shortcut
 * ---------------------------------------------------------------------------------------------------------------------
*/
function getHotkeys(keys)
{
	return keys.substr(0,keys.lastIndexOf('+')+2)+CharCode(keys.substr(keys.lastIndexOf('+')+2,2));
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Convert's char code to char
 * ---------------------------------------------------------------------------------------------------------------------
*/
function CharCode(code)
{
	return String.fromCharCode(code).toLowerCase();
}

function _is_update()
{
	action = window.location.href.split('?');

	if(action[1] !== undefined)
	{
		return ' was successfully '+action[1];
	}
	else
	{
		return '';
	}
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Save user defined options
 * ---------------------------------------------------------------------------------------------------------------------
*/
function keyDown(e,kb)
{
	out = "";
	if(e.ctrlKey) out += "ctrl + ";
	if(e.shiftKey) out += "shift + ";
	if(e.altKey) out += "alt + ";
	if(e.metaKey) out += "meta + ";

	code = e.keyCode;
	code = code == 16 ||code == 17 ||code == 18?null:code;
	e.target.value = out + CharCode(code);
	if(kb == 0)
	{
		element.hotkey = out + code;
	}
	else
	{
		sec_hotkey = out + code;
	}
	e.preventDefault();
	return false;
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Toggle's visibility of specified html element
 * ---------------------------------------------------------------------------------------------------------------------
*/
function toggle(id)
{
	var elem = document.getElementById(id);

	if(elem.style.display == 'block')
	{
		elem.style.display = 'none';
	}
	else
	{
		elem.style.display = 'block';
	}
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Load extension localized messages and descriptions
 * ---------------------------------------------------------------------------------------------------------------------
*/
function setLocales()
{
	locales = document.getElementsByClassName('locale');
	locales = Array.prototype.slice.call(locales);

	for(i=0;locales.length;i++)
	{
		if(locales[i] === undefined) break; //Fix 4 Uncaught error
		if(chrome.i18n.getMessage(locales[i].id) != '')
		{
				locales[i].innerHTML = chrome.i18n.getMessage(locales[i].id);
		}
	}
    element.testtext.value = chrome.i18n.getMessage('lang_testtext');
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Get avalible TTS engines
 * ---------------------------------------------------------------------------------------------------------------------
*/
function getVoices()
{
	var voice = document.getElementById('voice');
	var voiceArray = [];
	chrome.tts.getVoices(function(va)
	{
		voiceArray = va;
		for (var i = 0; i < voiceArray.length; i++)
		{
			var opt = document.createElement('option');
			var name = voiceArray[i].voiceName;

			if (name == options.voice)
			{
				opt.setAttribute('selected', '');
			}
			opt.setAttribute('value', name);
			opt.innerText = voiceArray[i].voiceName;
			voice.appendChild(opt);
		}

		voice_options(options.voice);
	});
}

function get_ivoices()
{
	var request = new XMLHttpRequest();
	request.open("GET", "http://www.ispeech.org/key?key=59e482ac28dd52db23a22aff4ac1d31e&voices&output=json&labels", true);
	request.onreadystatechange = function()
	{
		if (request.readyState == 4)
		{
			// innerText does not let the attacker inject HTML elements.
			voicesContent = JSON.parse(request.responseText, function (key, value)
			{
				if(key != '' && key != 'eurdutchmale')
				{
					var option=document.createElement("option");
					option.value = key;
					option.text= value;
					if (key == options.ivoice)
					{
						option.setAttribute('selected', '');
					}
					element.ivoice.appendChild(option);
				}
			});
		}
	}
	request.send();
}

/*
 * ---------------------------------------------------------------------------------------------------------------------
 * Init main options variables and methods
 * ---------------------------------------------------------------------------------------------------------------------
*/
(function()
{
	set_vars(vars);
	init_listeners();
	restore_options();
	getVoices();
	setLocales();
})();