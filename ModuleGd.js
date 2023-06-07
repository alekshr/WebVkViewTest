import { myGameInstance } from './ModuleGame.js'


let gdShowInterstitial = false;
let gdShowReward = false;
let gdStartedShowAd = false;

let isOnline = true;


export async function InitGD()
{
    window["GD_OPTIONS"] = {
        "gameId": "1cc306c4295d43e68d738805707242c9",
        "onEvent": function(event)
        {
            switch (event.name)
            {
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
                    myGameInstance.SendMessage('GDRewardAds', 'CloseAds');
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
    window.addEventListener('online', () => isOnline = true);
    window.addEventListener('offline', () => isOnline = false);
}

async function GdPreRollShow(){

    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined")
    {
        await gdsdk.showAd(gdsdk.AdType.Preroll);
    }
}

export function GdPreloadReward()
{
    if (typeof gdsdk !== "undefined" && typeof gdsdk.preloadAd !== "undefined")
    {
        gdsdk.preloadAd(gdsdk.AdType.Rewarded)
            .then(function (response)
            {
                myGameInstance.SendMessage("GDRewardAds", "PreloadAdsResult", 1);
            })
            .catch(function (error)
            {
                myGameInstance.SendMessage("GDRewardAds", "PreloadAdsResult", 0);
            });
    }
}

export function GdPreloadInterstitial()
{
    if (typeof gdsdk !== "undefined" && typeof gdsdk.preloadAd !== "undefined")
    {
        gdsdk.preloadAd(gdsdk.AdType.Midroll)
            .then(function (response)
            {
                myGameInstance.SendMessage("GDInterstitialAds", "PreloadAdsResult", 1);
            })
            .catch(function (error)
            {
                myGameInstance.SendMessage("GDInterstitialAds", "PreloadAdsResult", 0);
            });
    }
}

export function GdShowReward()
{
    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined")
    {
        gdsdk.showAd(gdsdk.AdType.Rewarded)
            .then(function (response)
            {
                gdShowReward = true;
            })
            .catch(function (error)
            {
                gdShowReward = false;
                myGameInstance.SendMessage('GDRewardAds', 'ResultShowAds', 0);
            });
    }
}

export function GdShowInterstitial()
{
    if (typeof gdsdk !== "undefined" && typeof gdsdk.showAd !== "undefined")
    {
        gdsdk.showAd(gdsdk.AdType.Midroll)
            .then(function (response)
            {
                gdShowInterstitial = true;
            })
            .catch(function (error)
            {
                gdShowInterstitial = false;
                myGameInstance.SendMessage('GDInterstitialAds', 'ResultShowAds', 0);
            });
    }
}

export function GdResultShowInterstitial()
{
    if (gdStartedShowAd && gdShowInterstitial && isOnline)
    {
        myGameInstance.SendMessage('GDInterstitialAds', 'ResultShowAds', 1);
    }

    gdShowInterstitial = false;
}

export function GdResultShowReward()
{
    if (gdStartedShowAd && gdShowReward && isOnline)
    {
        myGameInstance.SendMessage('GDRewardAds', 'ResultShowAds', 1);
    }

    gdShowReward = false;
}
