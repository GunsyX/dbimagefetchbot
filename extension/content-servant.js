// REMEMEBER! DONT FORGET TO RELOAD THE EXTENSION AFTER CODE EDITS
const sendMessage = (msg) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(msg, response => {
            if(response === undefined)console.log("ummm:", chrome.runtime.lastError.message);
            resolve(response);
        });
        console.log('message sent');
    });
}

const main = () => {
    console.log('ImageFetchBot is running');

    addEventListener('ifbSearch', x=>{
        fetchImages(x.detail).then(images=>{
            console.log('imagefetch process reached destination');
            console.log(images);
            const searchResultEvent = new CustomEvent('ifbSearchResult', {detail: images});
            // dispatchEvent(searchResultEvent);
            document.dispatchEvent(searchResultEvent);
        });
    })

    addEventListener('ifbImageMagnify', x=>{
        const magnifyPromise = sendMessage({type: 'imageMagnify', alt: x.detail});
        magnifyPromise.then(src=>{
            const magnifyCallbackEvent = new CustomEvent('ifbMagnifyCallback', {detail: src});
            document.dispatchEvent(magnifyCallbackEvent);
        })
    })

    // fetchImages('MTR sambarpowder').then(images=>{
    //     console.log('imagefetch process reached destination');
    //     console.log(images);
    //     const searchResultEvent = new CustomEvent('ifbSearchResult', {detail: images});
    //     // dispatchEvent(searchResultEvent);
    //     document.dispatchEvent(searchResultEvent);
    // });
}


// https://www.google.com/search?q= MTR+Sambar+Powder+100g &tbm=isch

const fetchImages = (query) => {
    return sendMessage({type: 'getImage', query});
}

if(location.host.includes(':2020')){
    main();
}