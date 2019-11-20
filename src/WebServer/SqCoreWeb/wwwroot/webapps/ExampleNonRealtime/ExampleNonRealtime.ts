export {}; // TS convention: To avoid top level duplicate variables, functions. This file should be treated as a module (and have its own scope) or not as a script (and share the global scope with other scripts (files)).

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


document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded(). All JS were downloaded. DOM fully loaded and parsed.');
});

window.onload = function onLoadWindow() {
    console.log('SqCore: window.onload() BEGIN. All CSS, and images were downloaded.'); // images are loaded at this time, so their sizes are known

    AsyncStartDownloadAndExecuteCbLater('/ExampleNonRealtime', (json: any) => {
        // const jsonToStr = JSON.stringify(json).substr(0, 60) + '...';
        getDocElementById('DebugDataArrivesHere').innerText = '***"' + json[0].stringData + '"***';
    });

    console.log('SqCore: window.onload() END.');
};

console.log('SqCore: Script END');
