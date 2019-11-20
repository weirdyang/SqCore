var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 1. Declare some global variables and hook on DOMContentLoaded() and window.onload()
console.log('SqCore: Script BEGIN4');
function AsyncStartDownloadAndExecuteCbLater(url, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        fetch(url)
            .then(response => {
            console.log('SqCore.AsyncStartDownloadAndExecuteCbLater(): Response object arrived:');
            if (!response.ok) {
                return Promise.reject(new Error('Invalid response status'));
            }
            response.json().then(json => {
                // const jsonToStr = JSON.stringify(json).substr(0, 60) + '...';
                // console.log('SqCore.AsyncStartDownloadAndExecuteCbLater():: data body arrived:' + jsonToStr);
                callback(json);
            });
        })
            .catch((err) => {
            console.log('SqCore: Download error.');
        });
    });
}
function getDocElementById(id) {
    return document.getElementById(id); // type casting assures it is not null for the TS compiler. (it can be null during runtime)
}
const gVidIds = {
    iss: 'W0LHTWG-UmQ', minority: 'q0LRHkWyNEA', stocks3d: '86MKzstijzI', matrix: '8ZdpA3p9ZMY',
    london: 'a11-Rudtkps', sea: 'TtGW5XIz7R4', clouds: 'Wimkqo8gDZ0'
};
let iVidBkg = Math.floor(Math.random() * 7) + 1; // [1..7] inclusive
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded(). All JS were downloaded. DOM fully loaded and parsed.');
});
window.onload = function onLoadWindow() {
    console.log('SqCore: window.onload() BEGIN. All CSS, and images were downloaded.'); // images are loaded at this time, so their sizes are known
    // var x = document.getElementById("player").contentWindow.document.body.getElementsByClassName("html5-video-player");  // Blocked a frame with origin "https://127.0.0.1:5001" from accessing a cross-origin frame.
    // x.style.backgroundColor = "#f00"
    getDocElementById('video-selector-1').selectedIndex = iVidBkg - 1; // changing the combobox selection only works in window.onload(), not yet in DOMContentLoaded()
    if (iVidBkg === 5 || iVidBkg === 7) {
        getDocElementById('MainDivOverVidBkg').style.color = '#000080';
    }
    else {
        getDocElementById('MainDivOverVidBkg').style.color = '#ffffff';
    }
    AsyncStartDownloadAndExecuteCbLater('/ExampleNonRealtime', (json) => {
        // const jsonToStr = JSON.stringify(json).substr(0, 60) + '...';
        getDocElementById('DebugDataArrivesHere').innerText = '***"' + json[0].stringData + '"***';
    });
    console.log('SqCore: window.onload() END.');
};
// 2. This code loads the YouTube IFrame Player API code asynchronously.
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
if (firstScriptTag != null && firstScriptTag.parentNode != null) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
// 3. This function creates an <iframe> (and YouTube player) after the API code script downloads from www.youtube.com
let player;
// @ts-ignore error TS6133: '*' is declared but its value is never read.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-player', {
        height: '280',
        width: '640',
        videoId: gVidIds[Object.keys(gVidIds)[iVidBkg - 1]],
        playerVars: {
            autoplay: 1,
            disablekb: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            loop: 1,
            fs: 0,
            autohide: 0,
            rel: 0,
            // mute: 1,     Not defined in TS playerVars
            enablejsapi: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}
// 4. The YT API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.mute();
    event.target.playVideo();
}
// 5. The YT API calls this function when the player's state changes.
function onPlayerStateChange(event) {
    if (event.data === 0 /* ENDED */) {
        player.seekTo(0);
        player.playVideo();
    }
}
// @ts-ignore error TS6133: '*' is declared but its value is never read.
function stopVideo() {
    player.stopVideo();
}
// @ts-ignore error TS6133: '*' is declared but its value is never read.
function video_selector_onchange() {
    const vdBkgSelector = getDocElementById('video-selector-1');
    const selectedOption = vdBkgSelector.value;
    console.log('video-selector-onchange(). You selected: ' + selectedOption);
    const vidId = gVidIds[selectedOption];
    console.log('video-selector-onchange(). loadVideoById(): ' + vidId);
    player.loadVideoById(vidId);
    iVidBkg = vdBkgSelector.selectedIndex + 1;
    if (iVidBkg === 5 || iVidBkg === 7) {
        getDocElementById('MainDivOverVidBkg').style.color = '#000080';
    }
    else {
        getDocElementById('MainDivOverVidBkg').style.color = '#ffffff';
    }
}
console.log('SqCore: Script END');
//# sourceMappingURL=ExampleNonRealtime.js.map