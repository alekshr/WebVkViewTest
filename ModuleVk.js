import { myGameInstance } from './ModuleGame.js'
import { Sleep } from './ModuleSleep.js'
import { lzw_encode, lzw_decode, decodeHtmlEntity } from './ModuleLZW.js'

const width = 645;

let loadData = "";
let isSaveData = false;
let accessToken;

const vkAppId = 51593514;

const timeWaitSave = 3000;
let canvasGame;
let touchEvent;
export async function InitVk() {
    await vkBridge.subscribe((e) => console.log("vkBridge event", e.detail.type));
    canvasGame = document.querySelector("canvas");
    touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: 100,
        clientY: 200,
        screenX: 100,
        screenY: 200
      });

    IsSupportedApi("VKWebAppViewHide");
    IsSupportedApi("VKWebAppViewRestore");


    let data = await vkBridge.send("VKWebAppInit", {});

    await vkBridge.subscribe(function (e) {
        if (e.detail.type === "VKWebAppShowNativeAdsResult") {
            window.focus();
            console.log(`Реклама показана e.detail.data = ${JSON.stringify(e.detail.data)}`);
        }

        if (e.detail.type === "VKWebAppShowNativeAdsFailed") {
            window.focus();
            console.log(`Реклама была не показана из-за ошибки: e.detail.data = ${JSON.stringify(e.detail.data)}`);
        }

        if (e.detail.type === "VKWebAppResizeWindowResult") {
            console.log(`Поменяли размер окна ${e.detail.data.width}x${e.detail.data.height}`);
        }
    });

    let dataGetAccessToken = await vkBridge.send('VKWebAppGetAuthToken', { app_id: vkAppId, scope: '' });
    accessToken = dataGetAccessToken.access_token;

    if (data.result) {
        console.log("Is init SDK VK");
        // await SetIFrameSize();
        await InitLoadData();
        window.addEventListener('unload', (event) => myGameInstance.SendMessage("WebDataManager", "SaveByExit"));
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
                setTimeout(() => simulateTouchOnElement(), 1000);
            }
        });
    } else {
        console.log("Is not inited SDK VK");
    }
}

function simulateTouchOnElement() {
    if(canvasGame && touchEvent)
    {
        console.log("апрув тач");
        canvasGame.dispatchEvent(touchEvent);

    }
}


function IsSupportedApi(method) {
    if (vkBridge.supports(method)) {
        console.log(`Есть поддержка ${method}`);
    } else {
        console.log(`Нет поддержки ${method}`);
    }
}


export async function VkPreloadReward() {
    await VkActionAds("VKWebAppCheckNativeAds",
        'VkRewardAds',
        'reward',
        'PreloadAdsResult');
}

export async function VkPreloadInterstitial() {
    await VkActionAds("VKWebAppCheckNativeAds",
        'VkInterstitialAds',
        'interstitial',
        'PreloadAdsResult');
}

export async function VkShowReward() {
    await VkActionAds("VKWebAppShowNativeAds",
        'VkRewardAds',
        'reward',
        'ResultShowAds');
}

export async function VkShowInterstitial() {
    await VkActionAds("VKWebAppShowNativeAds",
        'VkInterstitialAds',
        'interstitial',
        'ResultShowAds');
}

async function VkActionAds(nameApiMethod,
    nameGameObjectUnity,
    typeAds,
    callBackResult) {
    try {
        let data = await vkBridge.send(nameApiMethod, { ad_format: typeAds });
        if (data.result) {
            myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 1);
        } else {
            myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 0);
        }
    }
    catch (e) {
        myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 0);
        console.log(`Vk Action e = ${JSON.stringify(e)}`);
    }
}

export async function SetIFrameSize() {
    let data = await vkBridge.send('VKWebAppResizeWindow', {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    });
}

export function VkLoadCloud() {
    Sleep(timeWaitSave);
    let len = 1024;
    let lenData = loadData.length;

    let size = 0;
    let sliceStr;

    while (lenData > 0) {
        sliceStr = loadData.slice(size, size + len);
        myGameInstance.SendMessage('WebDataManager', 'InitData', sliceStr);
        size = size + len;
        lenData = lenData - len;
    }

    setTimeout(() => isSaveData = true, timeWaitSave);
    return true;
}


export async function VkSaveCloud(jsonData, flush) {
    try {
        if (isSaveData) {
            let len = 2048;
            let lenData = jsonData.length;
            let size = 0;
            let sliceStr;
            let index = 0;

            while (lenData > 0) {
                sliceStr = jsonData.slice(size, size + len);
                size = size + len;
                lenData = lenData - len;


                let formData = new FormData();
                formData.append("key", "SavedStringKey" + String(index));
                formData.append("value", sliceStr);
                formData.append("access_token", accessToken);
                formData.append("v", "5.131");

                let isRequestBeacon = navigator.sendBeacon(`https://api.vk.com/method/storage.set`, formData);
                index++;
            }
        }
    }
    catch (e) {
        console.log(`save exception Message: ${e.message}`)
    }
}


export async function VkInviteFriends() {
    try {
        await vkBridge.send('VKWebAppShowInviteBox', {});
    }
    catch (e) {
        console.log(e);
    }
}



async function InitLoadData() {
    let keysLoad = await vkBridge.send('VKWebAppStorageGetKeys', { count: 10, offset: 0 });
    let dataKeys = await vkBridge.send('VKWebAppStorageGet', {
        keys: keysLoad.keys
    });

    for (let index = 0; index < keysLoad.keys.length; index++) {
        if (dataKeys.keys[index].key.indexOf("SavedStringKey") >= 0) {
            loadData += dataKeys.keys[index].value;
        }
    }
    loadData = decodeHtmlEntity(loadData);
}
