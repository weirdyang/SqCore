// 1. Declare some global variables and hook on DOMContentLoaded() and window.onload()
console.log('SqCore: Script BEGIN4');

async function AsyncStartDownloadAndExecuteCbLater(url: string, callback: (json: any) => any) {
    fetch(url)
    .then(response => { // asynch long running task finishes. Resolves to get the Response object (http header, info), but not the full body (that might be streaming and arriving later)
        console.log('SqCore.AsyncStartDownloadAndExecuteCbLater(): Response object arrived:');
        if (!response.ok) {
            return Promise.reject(new Error('Invalid response status'));
        }
        response.json().then(json => {  // asynch long running task finishes. Resolves to the body, converted to json() object or text()
            // const jsonToStr = JSON.stringify(json).substr(0, 60) + '...';
            // console.log('SqCore.AsyncStartDownloadAndExecuteCbLater():: data body arrived:' + jsonToStr);
            callback(json);
        });
    })
    .catch((err) => {
        console.log('SqCore: Download error.');
    });
}

function getDocElementById(id: string): HTMLElement {
    return (document.getElementById(id) as HTMLElement);   // type casting assures it is not null for the TS compiler. (it can be null during runtime)
}

let gVidIds = {
    iss: 'W0LHTWG-UmQ', minority: 'q0LRHkWyNEA', stocks3d: '86MKzstijzI', matrix: '8ZdpA3p9ZMY',
    london: 'a11-Rudtkps', sea: 'TtGW5XIz7R4', clouds: 'Wimkqo8gDZ0'
};

let iVidBkg: number = Math.floor(Math.random() * 7) + 1; // [1..7] inclusive


document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded(). All JS were downloaded. DOM fully loaded and parsed.');
});

window.onload = function onLoadWindow() {
    console.log('SqCore: window.onload() BEGIN. All CSS, and images were downloaded.'); // images are loaded at this time, so their sizes are known
    // var x = document.getElementById("player").contentWindow.document.body.getElementsByClassName("html5-video-player");  // Blocked a frame with origin "https://127.0.0.1:5001" from accessing a cross-origin frame.
    // x.style.backgroundColor = "#f00"
    (getDocElementById('video-selector-1') as HTMLSelectElement).selectedIndex = iVidBkg - 1; // changing the combobox selection only works in window.onload(), not yet in DOMContentLoaded()
    if (iVidBkg === 5 || iVidBkg === 7) {
        getDocElementById('MainDivOverVidBkg').style.color = '#000080';
    } else {
        getDocElementById('MainDivOverVidBkg').style.color = '#ffffff';
    }

    AsyncStartDownloadAndExecuteCbLater('/ExampleNonRealtime', (json: any) => {
        // const jsonToStr = JSON.stringify(json).substr(0, 60) + '...';
        getDocElementById('DebugDataArrivesHere').innerText = '***"' + json[0].stringData + '"***';
    });

    console.log('SqCore: window.onload() END.');
};


// 2. This code loads the YouTube IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
let firstScriptTag = document.getElementsByTagName('script')[0];
if (firstScriptTag != null && firstScriptTag.parentNode != null) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player) after the API code script downloads from www.youtube.com
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-player', {
        height: '280',
        width: '640',
        videoId: gVidIds[Object.keys(gVidIds)[iVidBkg - 1]],
        playerVars: {
            autoplay: 1,        // Auto-play the video on load
            disablekb: 1,
            controls: 0,        // Hide pause/play buttons in player
            showinfo: 0,        // Hide the video title, deprecated as of 25/09/2018
            modestbranding: 1,  // Hide the Youtube Logo, Note that a small YouTube text label will still display in the upper-right corner of a paused video when the user's mouse pointer hovers over the player.
            loop: 1,            // Run the video in a loop
            fs: 0,              // Hide the full screen button
            autohide: 0,        // obsolete, Hide video controls when playing
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
    if (event.data === YT.PlayerState.ENDED) {
        player.seekTo(0);
        player.playVideo();
    }
}

function stopVideo() {
    player.stopVideo();
}

function video_selector_onchange() {
    const vdBkgSelector: HTMLSelectElement = getDocElementById('video-selector-1') as HTMLSelectElement;
    const selectedOption: string = vdBkgSelector.value;
    console.log('video-selector-onchange(). You selected: ' + selectedOption);
    const vidId = gVidIds[selectedOption];
    console.log('video-selector-onchange(). loadVideoById(): ' + vidId);
    player.loadVideoById(vidId);

    iVidBkg = vdBkgSelector.selectedIndex + 1;
    if (iVidBkg === 5 || iVidBkg === 7) {
        getDocElementById('MainDivOverVidBkg').style.color = '#000080';
    } else {
        getDocElementById('MainDivOverVidBkg').style.color = '#ffffff';
    }
}

console.log('SqCore: Script END');
