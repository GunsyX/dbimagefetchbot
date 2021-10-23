// IMPORTANT VALUES: 
// CHANGE THESE CLASS NAMES IF TEHE'RE UPDATED BY GOOGLE
const theatreClass = 'n3VNCb';
const productClass = 'rg_i Q4LuWd';

const sendMessage = (msg) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(msg, response => {
            if(response === undefined)console.log("ummm:", chrome.runtime.lastError.message);
            resolve(response);
        });
    });
}

const main = () => {
    console.log('content google of ImageFetchBot is running');
    // fetchImages('MTR sambarpowder').then(images=>{
    //     console.log('imagefetch process reached destination');
    //     console.log(images);
    // });
}


// // https://www.google.com/search?q= MTR+Sambar+Powder+100g &tbm=isch

// // const fetchImages = (query) => {
// //     return sendMessage({type: 'getImage', query});
// // }

sendMessage({type: 'imageTabRegisterRequest'}).then(res=>{
    if(res === true){
        main();
    }else if(res === false){
        console.log('verification failed');
    }
});


let currentTheatreAlt = '';
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(
        sender.tab?
        "from content script:" + sender.tab.url:
        "from the extension"
    );

    if(request.type === 'proceedToFetchImages'){
        const images = extractImages();
        sendResponse(images);
    }
   
    if(request.type = 'imageMagnify'){
        currentTheatreAlt = request.alt;
        const rawImagesList = Array.from(document.getElementsByClassName(productClass));
        const image = rawImagesList.find(x=>x.alt===request.alt);
        image.click();
        setTimeout(() => {
            //ok so theres some confusion w there being multiple theater class elements (1-3),
            //so I'm gonna do some workaround to get the actual image class after observing the tree 
            if(currentTheatreAlt === request.alt){
                const bigImageList = Array.from(document.getElementsByClassName(theatreClass));
                let bigImage;
                bigImageList.map(x=>{
                    if(!!(x.offsetParent)){
                        bigImage = x;
                    }
                });
                console.log(bigImage.src);
                sendResponse({src: bigImage.src});
            }else{
                sendResponse(false);
            }
        }, (700));
        return true;
    }
});


const extractImages = () => {
    window.scrollBy(0, 1200);
    const rawImagesList = Array.from(document.getElementsByClassName(productClass));
    const imageList = [];
    rawImagesList.map(x=>{
        if(x.currentSrc !== ''){
            imageList.push({src: x.currentSrc, alt: x.alt});
        }
    })
    // SO BASICALLY, if window is not in view/focus(notsure), only 20 images are rendered
    // im assuming 20 pics are enough for now, if more are needed we could try fiddling around with
    // chrome.windows.update( window id {focused: true}) fn or something
    // i just guessed that^ line dont use it.
    console.log(imageList);
    // now send back the images
    return imageList;
}