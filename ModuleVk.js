import { myGameInstance } from './ModuleGame.js'
import { Sleep } from './ModuleSleep.js'
import { decodeHtmlEntity } from './ModuleLZW.js'

const width = 645;

let loadData = "";
let isSaveData = false;
let accessToken;

const vkAppId = 51593514;

const timeWaitSave = 3000;

export async function InitVk()
{
    
    let data = await vkBridge.send("VKWebAppInit", {});

    try
    {
        let dataGetAccessToken = await vkBridge.send('VKWebAppGetAuthToken', { app_id: vkAppId, scope: '' });
        accessToken = dataGetAccessToken.access_token;
    
        if (data.result)
        {
            console.log("Is init SDK VK");
            window.addEventListener('unload', (event) => myGameInstance.SendMessage("WebDataManager", "SaveByExit"));
            await InitLoadData();
        } else
        {
            console.log("Is not inited SDK VK");
        }
    }
    catch(exception)
    {
        console.error(JSON.stringify(exception));
    }
   
}

function IsSupportedApi(method){
    if (vkBridge.supports(method)) {
        console.log(`Есть поддержка ${method}`);
    }else{
        console.log(`Нет поддержки ${method}`);
    }
}

export async function VkPreloadReward()
{
    await VkActionAds("VKWebAppCheckNativeAds",
        'VkRewardAds',
        'reward',
        'PreloadAdsResult');
}

export async function VkPreloadInterstitial()
{
    await VkActionAds("VKWebAppCheckNativeAds",
        'VkInterstitialAds',
        'interstitial',
        'PreloadAdsResult');
}

export async function VkShowReward()
{
    await VkActionAds("VKWebAppShowNativeAds",
        'VkRewardAds',
        'reward',
        'ResultShowAds');
}

export async function VkShowInterstitial()
{
    await VkActionAds("VKWebAppShowNativeAds",
        'VkInterstitialAds',
        'interstitial',
        'ResultShowAds');
}

async function VkActionAds(nameApiMethod,
    nameGameObjectUnity,
    typeAds,
    callBackResult)
{
    try
    {
        let data = await vkBridge.send(nameApiMethod, { ad_format: typeAds });
        if (data.result)
        {
            myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 1);
        } else
        {
            myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 0);
        }
    }
    catch (e)
    {
        myGameInstance.SendMessage(nameGameObjectUnity, callBackResult, 0);
        console.error(`Vk Action e = ${JSON.stringify(e)}`);
    }
}

export function SetIFrameSize()
{
    vkBridge.send('VKWebAppResizeWindow', {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    });
}

export function VkLoadCloud()
{
    Sleep(timeWaitSave);
    let len = 1024;
    let lenData = loadData.length;

    let size = 0;
    let sliceStr;

    while (lenData > 0)
    {
        sliceStr = loadData.slice(size, size + len);
        myGameInstance.SendMessage('WebDataManager', 'InitData', sliceStr);
        size = size + len;
        lenData = lenData - len;
    }

    setTimeout(() => isSaveData = true, timeWaitSave);
    return true;
}


export async function VkSaveCloud(jsonData, flush)
{
    try
    {
        if (isSaveData)
        {
            let len = 2048;
            let lenData = jsonData.length;
            let size = 0;
            let sliceStr;
            let index = 0;

            while (lenData > 0)
            {
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
    catch (e)
    {
        console.error(`save exception Message: ${e.message}`)
    }
}


export async function VkInviteFriends()
{
    try
    {
        await vkBridge.send('VKWebAppShowInviteBox', {});
    }
    catch (e)
    {
        console.error(e);
    }
}



async function InitLoadData()
{
    try
    {
        console.log("vkBridge Init Data");

        let keysLoad = await vkBridge.send('VKWebAppStorageGetKeys', { count: 10, offset: 0 });
        let dataKeys = await vkBridge.send('VKWebAppStorageGet', {
            keys: keysLoad.keys
        });
    
        for (let index = 0; index < keysLoad.keys.length; index++)
        {
            if (dataKeys.keys[index].key.indexOf("SavedStringKey") >= 0)
            {
                loadData += dataKeys.keys[index].value;
            }
        }
        loadData = decodeHtmlEntity(loadData);
        console.log("vkBridge Data is Initing");
    }
    catch(exception)
    {
        console.error(JSON.stringify(exception));
    } 
}
