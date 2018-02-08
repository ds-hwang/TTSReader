/*
 * TTS Reader Speech Input
 *
 * This file contains TTS Reader speech input and shortcut's functions
 *
 * @package		TTS Reader
 * @category	Speech Input
 * @author		SkechBoy, Dongseong Hwang
 * @link		https://github.com/ds-hwang/TTSReader
 */

/*
 * -----------------------------------------------------------------------------
 * Defining main background variables and get user defined options
 * -----------------------------------------------------------------------------
 */
chrome.extension.sendRequest({
    method: "getOptions"
}, function (response) {
    var options = response.options,
        ctrl = /ctrl/.test(options.hotkeys),
        shift = /shift/.test(options.hotkeys),
        alt = /alt/.test(options.hotkeys),
        code = options.hotkeys.substr(options.hotkeys.lastIndexOf('+') + 2);

    document.addEventListener("keydown", function (e) {
        if ((e.keyCode == code) && e.ctrlKey == ctrl && e.shiftKey == shift && e.altKey == alt) {
            e.preventDefault();
            var selected = {
                "text": window.getSelection().toString(),
                "method": undefined,
                "code": e.keyCode
            };
            chrome.extension.sendRequest(selected);
            return false;
        }
    }, false);

    if (options.speechinput) {
        console.log('TTS Reader speech input feature is currently disabled. We are working on new version, which will have improved speech input feature.');
        //addSpeech();
    }
});

/*
 * -----------------------------------------------------------------------------
 * Load ads into pages
 * -----------------------------------------------------------------------------
 */
function _show_ads(ADS_URL) {
    ads = document.createElement("script");
    ads.type = "application/javascript";
    ads.src = ADS_URL;
    document.body.appendChild(ads);
}

/*
 * -----------------------------------------------------------------------------
 * Initializing speech input procedures if enabled
 * -----------------------------------------------------------------------------
 */
function addSpeech() // add speech input feature
{
    var textinputs = document.getElementsByTagName("input");
    for (var x = 0; x < textinputs.length; x++) {
        if (textinputs[x].type == "text") {
            textinputs[x].setAttribute('x-webkit-speech', 'x-webkit-speech');
        }
    }
}