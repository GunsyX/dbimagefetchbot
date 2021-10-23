const sendMessage = (msg, tabId) => {
    return new Promise((resolve, reject) => {
        // chrome.tabs.query({id: tabID}, (tabs=>tabs[0].sendMessage(msg, response => {
        //     if(response === undefined)console.log("ummm:", chrome.runtime.lastError.message);
        //     resolve(response);
        // })));
        // console.log(tab);
        // chrome.tabs.query({windowId: imageWindow.id}, (tabs=>tabs.find(x=>x.id===imageTab.id).sendMessage(msg, response => {
        //     if(response === undefined)console.log("ummm:", chrome.runtime.lastError.message);
        //     resolve(response);
        // })));
        // chrome.tabs.query({windowId: imageWindow.id}, (tabs)=>{
        //     const tab = tabs.find(x=>x.id===imageTab.id);
        // });
        chrome.tabs.sendMessage(tabId, msg, response => {
            if(response === undefined)console.log("ummm:", chrome.runtime.lastError.message);
            resolve(response);
        });
    });
}

chrome.browserAction.onClicked.addListener(() => {
    // chrome.tabs.create({ url: chrome.runtime.getURL("trainer-page.html")});
})
console.log('background');

const getGoogleImageSearchURL = (q) => {
    // `MTR%20sambar%20powder`
    const query = encodeURI(q);
    // plus `+` should be converted to `%2B` manually or they 
    // will be converted to space in google search query
    // im assuming we won't be using plus `+`, so not bothering to do that.
    const url = `https://www.google.com/search?tbm=isch&tbs=isz:l&q=${query}`;
    //tbm=isch refers to google IMAGE search
    return url;
}

const imageWindow = {};
let imageTab = {};
let imageEvent;

const startImageFetch = (query, callback) => {
    if(imageTab.id === undefined){
        console.log('creating a new imageTab');
        const windowOptions = {
            url: getGoogleImageSearchURL(query),
            height: 1000,
            width: 1900,
            incognito: true
        }
        const windowCallback = (newWindow) => {
            console.log(newWindow);
            imageWindow.id = newWindow.id;
            imageTab.id = newWindow.tabs[0].id;
            imageEvent  = new Event('imgTab'+imageTab.id);
    
            const eventCallback = () => {
                removeEventListener('imgTab'+imageTab.id, eventCallback);
                console.log('image event fired');
                sendMessage({type: 'proceedToFetchImages'}, imageTab.id).then(response=>{
                    callback(response);
                })
            }
    
            addEventListener('imgTab'+imageTab.id, eventCallback);
        }
        chrome.windows.create(windowOptions, windowCallback);

    }else{
        new Promise((resolve, reject) => {
            console.log('using existing imageTab', imageTab.id);
            chrome.tabs.update(imageTab.id, {url: getGoogleImageSearchURL(query)}, x=>{
                if(chrome.runtime.lastError){
                    if(chrome.runtime.lastError.message){
                        // console.log('lastError,', chrome.runtime.lastError.message);
                        reject(chrome.runtime.lastError.message);
                    }   
                }
            })
    
            const eventCallback = () => {
                removeEventListener('imgTab'+imageTab.id, eventCallback);
                console.log('image event fired from existing one');
                sendMessage({type: 'proceedToFetchImages'}, imageTab.id).then(response=>{
                    callback(response);
                })
            }
            addEventListener('imgTab'+imageTab.id, eventCallback);
        }).catch(x=>{
            console.error('Error in image fetch promise for existing tab', x);
            console.log('Regenerating a new imageTab');
            imageTab = {};
            startImageFetch(query, callback);
        });
    }
}
// ---window props---
// alwaysOnTop: false
// focused: true
// height: 98
// id: 2035
// incognito: false
// left: 12
// state: "normal"
// tabs: Array(1)
//     0:
//         active: true
//         audible: false
//         autoDiscardable: true
//         discarded: false
//         groupId: -1
//         height: 10
//         highlighted: true
//         id: 2036
//         incognito: false
//         index: 0
//         mutedInfo: {muted: false}
//         pinned: false
//         selected: true
//         status: "loading"
//         width: 500
//         windowId: 2035
//         [[Prototype]]: Object
//         length: 1
//         [[Prototype]]: Array(0)
// top: 52
// type: "normal"
// width: 516

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(
        sender.tab?
        "from content script:" + sender.tab.url:
        "from the extension"
    );

    // if(request.greeting === "hello")
    // sendResponse({farewell: "goodbye"});

    // // new Promise(resolve=>handleRequestAsync(sendResponse));
    // (async x=> {
    //     console.log('1');
    // //     await handleRequestAsync();
    // // })().then(()=>{
    // //     sendResponse('22sowowowowowodoao 222');
    // //     console.log(5);
    //     // return new Promise(r=>{
    //         setTimeout(x=>{
    //             // r();
    //             sendResponse('wowowowo');
    //         }, 1000);
    //     // })
    // })()//.then(x=>{console.log('dd')});
    // // handleRequestAsync(sendResponse).then(x=>{sendResponse('sadsaasd')});
    // // (async x=>{
    // //     console.log('x');
    // // })();


    if(request.type === 'getImage'){
        const callback = (images) => {
            console.log(images);
            sendResponse(images);
        }
        startImageFetch(request.query, callback);
        return true;
    }

    if(request.type === 'imageTabRegisterRequest'){
        console.log('image tab request from ', sender.tab.id);
        console.log('required image tab id', imageTab.id);
        if(sender.tab.id === imageTab.id){
            sendResponse(true);
            dispatchEvent(imageEvent);
        }else{
            sendResponse(false);
        }
    }
    
    if(request.type === 'imageMagnify'){
        sendMessage({type: 'imageMagnify', alt: request.alt}, imageTab.id).then(response=>{
            if(response.src){
                console.log('TRUE');
                sendResponse(response.src);
            }else{
                console.log('ERRR');
                sendResponse(false);
            }
        });
        return true;
    }

});

