import { myGameInstance } from './ModuleGame.js'
import { DetectIncognito } from './ModuleIncognito.js'
import { Sleep } from './ModuleSleep.js'


let gdShowInterstitial = false;
let gdShowReward = false;
let gdStartedShowAd = false;
let loadData;
let isOnline = true;

const noDataCloudKey = "noData";
const timeWaitLoadData = 2000;

export async function InitGD() {
    window["GD_OPTIONS"] = {
        "gameId": "9335ce474409412ca8ede77999644f67",
        "onEvent": function(event) {
            switch (event.name) {
                case "SDK_READY":
                    GdPreRollShow();
                    break;
                case "STARTED":
                    gdStartedShowAd = true;
                    break;
                case "SDK_GAME_START":
                    myGameInstance.SendMessage('WebViewAdsController', 'ResumeGame');
                    break;
                case "SDK_GAME_PAUSE":
                    myGameInstance.SendMessage('WebViewAdsController', 'PauseGame');
                    break;
                case "SDK_GDPR_TRACKING":
                    // this event is triggered when your user doesn't want to be tracked
                    break;
                case "SDK_GDPR_TARGETING":
                    // this event is triggered when your user doesn't want personalised targeting of ads and such
                    break;
                case "SDK_REWARDED_WATCH_COMPLETE":
                    break;
                case "SKIPPED":
                    gdShowInterstitial = false;
                    gdShowReward = false;
                    gdStartedShowAd = false;
                    myGameInstance.SendMessage('GDRewardAds', 'BreakRewardAds');
                    break;
                case "ALL_ADS_COMPLETED":
                    GdResultShowInterstitial();
                    GdResultShowReward();
                    gdStartedShowAd = false;
                    break;
            }
        },
    };
    let scriptSdk = document.createElement("script");
    let fjs = document.getElementsByTagName("script")[0];
    scriptSdk.id = "gamedistribution-jssdk";
    scriptSdk.src = "https://html5.api.gamedistribution.com/main.min.js";
    fjs.parentNode.insertBefore(scriptSdk, fjs);
    await InitLoadData();
    window.addEventListener('online', () => isOnline = true);
    window.addEventListener('offline', () => isOnline = false);
    window.addEventListener('beforeunload', function (e) {
        myGameInstance.SendMessage("WebDataManager", "SaveByExit");
        Sleep(2000);
    });
}

async function GdPreRollShow() {

    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined") {
        await gdsdk.showAd(gdsdk.AdType.Preroll);
    }
}

export function GdPreloadReward() {
    if (typeof gdsdk !== "undefined" && typeof gdsdk.preloadAd !== "undefined") {
        gdsdk.preloadAd(gdsdk.AdType.Rewarded)
            .then(function (response) {
                myGameInstance.SendMessage("GDRewardAds", "PreloadAdsResult", 1);
            })
            .catch(function (error) {
                myGameInstance.SendMessage("GDRewardAds", "PreloadAdsResult", 0);
            });
    }
}

export function GdPreloadInterstitial() {
    if (typeof gdsdk !== "undefined" && typeof gdsdk.preloadAd !== "undefined") {
        gdsdk.preloadAd(gdsdk.AdType.Midroll)
            .then(function (response) {
                myGameInstance.SendMessage("GDInterstitialAds", "PreloadAdsResult", 1);
            })
            .catch(function (error) {
                myGameInstance.SendMessage("GDInterstitialAds", "PreloadAdsResult", 0);
            });
    }
}

export function GdShowReward() {
    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined") {
        gdsdk.showAd(gdsdk.AdType.Rewarded)
            .then(function (response) {
                gdShowReward = true;
            })
            .catch(function (error) {
                gdShowReward = false;
                myGameInstance.SendMessage('GDRewardAds', 'ResultShowAds', 0);
            });
    }
}

export function GdShowInterstitial() {
    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined") {
        gdsdk.showAd(gdsdk.AdType.Midroll)
            .then(function (response) {
                gdShowInterstitial = true;
            })
            .catch(function (error) {
                gdShowInterstitial = false;
                myGameInstance.SendMessage('GDInterstitialAds', 'ResultShowAds', 0);
            });
    }
}

export function GdResultShowInterstitial() {
    if (gdStartedShowAd && gdShowInterstitial && isOnline) {
        myGameInstance.SendMessage('GDInterstitialAds', 'ResultShowAds', 1);
    }

    gdShowInterstitial = false;
}

export function GdResultShowReward() {
    if (gdStartedShowAd && gdShowReward && isOnline) {
        myGameInstance.SendMessage('GDRewardAds', 'ResultShowAds', 1);
    }

    gdShowReward = false;
}

export async function GdSaveCloud(jsonData, flush) {
    try {
        const resultPrivate = await DetectIncognito();
        if (!resultPrivate.isPrivate) {
            SaveLocal(jsonData);        
        }
    }
    catch (e) {
        console.error('CRASH Save Cloud: ', e.message);
        window.focus();
    }
}

export function GdLoadCloud() {
    Sleep(timeWaitLoadData);
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

    return true;
}

function SaveLocal(jsonData) {
    localStorage.setItem("save", jsonData);
}


async function InitLoadData() {
    try {
        const resultPrivate = await DetectIncognito();
        if (resultPrivate.isPrivate) {
            loadData = noDataCloudKey;
        } else {
            const dataLocal = localStorage.getItem("save");
            loadData = dataLocal ? dataLocal : noDataCloudKey;
        }
    } catch (e) {
        console.error('CRASH Load Cloud: ', e.message);
    }
}
