/*
 * TTS Reader GUI
 *
 * This file contains code that displays Grafical User Interface
 *
 * @package		TTS Reader
 * @category	GUI
 * @author		SkechBoy, Dongseong Hwang
 * @link		https://github.com/ds-hwang/TTSReader
*/

/*
 * -----------------------------------------------------------------------------
 * Defining main variables
 * -----------------------------------------------------------------------------
*/
	var prevstate = 0,
		status = 'play',
		bg = chrome.extension.getBackgroundPage(), // get background page
		button = document.getElementById('button'),
		reload = document.getElementById('reload'),
		canvas = document.getElementById('volume'),
		error = document.getElementById('error'),
		logo = document.getElementById('logo'),
		replaybtn = document.getElementById("replay"),
		play = document.getElementById("play"),
		options = JSON.parse(localStorage.getItem("options"));

/*
 * -----------------------------------------------------------------------------
 * Event listeners
 * -----------------------------------------------------------------------------
*/
	canvas.addEventListener('click', function() // Volume adjustment
	{
		volume = calculateVolume(event.clientX,event.clientY);
		drawVolume(volume);
	    bg.setVolume(parseFloat(volume));
	}, false);

	play.addEventListener('click', function() // Audio state
	{
		bg.resumeAudio();
	}, false);

	replaybtn.addEventListener('click', function() // Audio state
	{
		bg.replayAudio();
	}, false);

	reload.addEventListener('click', function() // Audio state
	{
		bg.reload();
		window.close();
	}, false);

	button.addEventListener('click', function() // Audio state
	{
		if(status == 'playing')
		{
			bg.pauseAudio();
			status = 'paused';
		}
		else
		{
			status = 'playing';
		}
		onClick(status);
	}, false);

	error.addEventListener('click', function()
	{
		// goes to Google TTS API and check if human confirmation is required
		chrome.tabs.create({url: 'http://goo.gl/OOVgp'});
	}, false);

	logo.addEventListener('click', function()
	{
		// redirect's to iSpeech TTS Reader page
		chrome.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=BEF44G79J2WVG'});
	});

/*
 * -----------------------------------------------------------------------------
 * Manipulating onClick button event
 * -----------------------------------------------------------------------------
*/
function onClick(state)
{
	var zen = document.getElementById("zen");
	var circle = document.getElementById("circle");
	var playbtn = document.getElementById("play");

	if(state == 'replay')
	{
		replaybtn.style.display = "block";
		playbtn.style.display = "none";
		circle.className = "circle rotate";
		zen.className = "replay";
	}
	else
	{
		playbtn.style.display = "block";
		replaybtn.style.display = "none";

		if(state == "playing" )
		{
			circle.className = "circle rotate";
			zen.className = "play";
		}
		else
		{
			circle.className = "circle"
			zen.className = "";
		}
	}

	status = state;
	bg.log('State: '+state);
};

/*
 * -----------------------------------------------------------------------------
 * Functions for controlling audio
 * -----------------------------------------------------------------------------
*/
function displayProgress(seconds)
{
	prevstate++;
	progress.style['-webkit-transition-duration'] = seconds+'s';
	deg = 360*prevstate;
	progress.style.webkitTransform = "rotate("+deg+"deg)";
}

/*
 * -----------------------------------------------------------------------------
 * Show error information
 * -----------------------------------------------------------------------------
*/
function showError()
{
	error.innerHTML = chrome.i18n.getMessage('lang_error');
	error.style.display = "block";
}

/*
 * -----------------------------------------------------------------------------
 * Recieve audio state
 * -----------------------------------------------------------------------------
*/
function sendState(state)
{
	onClick(state);
}

/*
 * -----------------------------------------------------------------------------
 * Draw volume level in canvas element
 * -----------------------------------------------------------------------------
*/
function drawVolume(volume)
{
	var radius = 63;
	canvas.width = canvas.width; // clear canvas and preppare for new drawing
	var context = canvas.getContext('2d');
	var canvas_size = [canvas.width, canvas.height];
	var center = [canvas_size[0]/2, canvas_size[1]/2];



	context.arc // draw volume
	(
		center[0],
		center[1],
		radius,
		0, // 0 sets set the start to be top
		Math.PI * (2 * (volume)),
		false
    );


    var rad = context.createRadialGradient(center[0], center[1], 50, center[0], center[1], 50);
    rad.addColorStop(0, '#CC7200');
    rad.addColorStop(1, '#FFAF22');

	context.lineWidth   = 8;
	context.strokeStyle = '#FF8F00';
	context.stroke();
}

/*
 * -----------------------------------------------------------------------------
 * Calculating aduio volume by point coordinates selected by user
 * -----------------------------------------------------------------------------
*/
function calculateVolume(x,y)
{
	x = x-(window.innerWidth/2);
	y = (y-75)*-1;

	radius = Math.sqrt((x*x )+(y*y));

	if(x > 0 && y >= 0) // detecting angle quadrand
	{
		angle = Math.asin(Math.abs(y)/radius)*(180/Math.PI);
	}
	else if(x < 0 && y >= 0)
	{
		angle = 180-(Math.asin(Math.abs(y)/radius)*(180/Math.PI));
	}
	else if(x <= 0 && y < 0)
	{
		angle = 180+(Math.asin(Math.abs(y)/radius)*(180/Math.PI));
	}
	else
	{
		angle = 360-(Math.asin(Math.abs(y)/radius)*(180/Math.PI));
	}
	volume = 1-(angle/360);

	return volume;
}

/*
 * -----------------------------------------------------------------------------
 * Display donations button if it's not disabled from options
 * -----------------------------------------------------------------------------
*/
function showLogo()
{
	if(options.logo)
	{
		logo.style.display = "block";
	}
}

/*
 * -----------------------------------------------------------------------------
 * Initalization on main and background functions
 * -----------------------------------------------------------------------------
*/
	showLogo();
	bg.getSelection(); // invoke TTS Reader main function
	sendState(bg.getState());
	drawVolume(options.volume);