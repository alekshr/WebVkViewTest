import { myGameInstance } from './ModuleGame.js'
import { Sleep } from './ModuleSleep.js'

import { lzw_encode, lzw_decode, decodeHtmlEntity } from './ModuleLZW.js'

let player;
let leaderboard;
let payments = null;
let inApp = "";
let promptCanShow = false;
let reviewCanShow = false;
let initSDK = false;
let initGame = false;
let firstAd = true;
let loadData = "";
let authJson;
let isSaveData = false;

const savesKey = "saves";
const idSavesKey = "idSaves";
const noDataCloudKey = "noData";

const timeWaitSave = 3000;
const timeWaitLoadData = 2000;

export async function InitYandex() {
    window.ysdk = await YaGames.init();
    initSDK = true;
    await YandexAuthorizationCheck();
    await InitLoadData();
    await InitYandexPayments();
    try {
        const prompt = await ysdk.shortcut.canShowPrompt();
        const review = await ysdk.feedback.canReview();

        if (prompt.canShow) {
            promptCanShow = true;
        }

        if (review.value) {
            reviewCanShow = true;
        } else {
            console.log('reviewCanShow = false', review.reason);
        }

    } catch (e) {
        console.error('CRASH canShowPrompt: ', e.message);
    }

    if (firstAd) {
        await ysdk.adv.showFullscreenAdv();
    }


    window.addEventListener('beforeunload' , function (e) {
        e = e || window.event;
        myGameInstance.SendMessage("WebDataManager", "SaveByExit");
        if (e) {
            e.returnValue = 'Вы точно хотите выйти?';
        }

        return 'Вы точно хотите выйти?';
    });
}


export function YandexShowReward() {
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                myGameInstance.SendMessage('YandexRewardAds', 'OpenShowReward');
            },
            onRewarded: () => {
                myGameInstance.SendMessage('YandexRewardAds', 'RewardedShowAds');
            },
            onClose: () => {
                myGameInstance.SendMessage('YandexRewardAds', 'CloseShowReward');
            },
            onError: (e) => {
                myGameInstance.SendMessage('YandexRewardAds', 'ErrorRewardShowAds');
            }
        }
    });
}

export function YandexShowInterstitial() {
    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: function () {
                myGameInstance.SendMessage('YandexInterstitialAds', 'OpenShowInterstitial');
            },
            onClose: function (wasShown) {
                myGameInstance.SendMessage('YandexInterstitialAds', 'CloseShowInterstitial');
                myGameInstance.SendMessage('YandexInterstitialAds', 'ResultShowAds', wasShown ? 1 : 0);
            },
            onError: function (error) {
                myGameInstance.SendMessage('YandexInterstitialAds', 'ResultShowAds', 0);
                console.log(error);
            }
        }
    });
}


async function InitYandexPayments() {
    try {
        payments = await window.ysdk.getPayments();
        console.log('Purchases are available');
        if (payments != null) {
            let products = await payments.getCatalog();

            let productID = [products.length];
            let title = [products.length];
            let description = [products.length];
            let priceValue = [products.length];
            let purchased = [products.length];

            for (let i = 0; i < products.length; i++) {
                productID[i] = products[i].id;
                title[i] = products[i].title;
                description[i] = products[i].description;
                priceValue[i] = products[i].priceValue;
                purchased[i] = 0;
            }

            let purchases = await payments.getPurchases();
            for (let i1 = 0; i1 < products.length; i1++) {
                for (let i2 = 0; i2 < purchases.length; i2++) {
                    if (products[i1].id === purchases[i2].productID) {
                        purchased[i1]++;
                    }
                }
            }

            inApp = {
                "id": productID,
                "title": title,
                "description": description,
                "priceValue": priceValue,
                "purchased": purchased
            };
            console.log(`inApp = ${JSON.stringify(inApp)}`);
        }
    } catch (e) {
        console.error('CRASH Init Payments: ', e.message);
    }
}


export async function YandexAuthorizationCheck() {
    console.log('Init GAME');
    initGame = true;
    if (initSDK == true) {
        window.ysdk.features.LoadingAPI?.ready();
        await YandexInitPlayer();
    }
}

async function YandexInitPlayer() {
    try {

        player = await ysdk.getPlayer({ scopes: false });

        let playerName = player.getName();

        if (player.getMode() === 'lite') {
            console.log('Not Authorized');
            YandexNotAuthorized();
        } else {
            authJson = {
                "playerAuth": "resolved",
                "playerName": playerName,
                "playerId": player.getUniqueID(),
            };
            //TODO: Исправить и сделать иницализацию для игрока в Unity 
            // myGameInstance.SendMessage('YandexGame', 'SetAuthorization', JSON.stringify(authJson));
            window.focus();
        }
    } catch (e) {
        console.error('CRASH init Player: ', e.message);
        YandexNotAuthorized();
        window.focus();
    }
}

function YandexNotAuthorized() {
    try {
        console.log('Authorized failed');
        authJson = {
            "playerAuth": "rejected",
            "playerName": "unauthorized",
            "playerId": "unauthorized",
            "playerPhoto": "null"
        };
        //TODO: Исправить и сделать иницализацию для игрока в Unity 
        // myGameInstance.SendMessage('YandexGame', 'SetAuthorization', JSON.stringify(authJson));
    } catch (e) {
        console.error('CRASH Not Authorized: ', e.message);
    }
}

export function YandexOpenAuthDialog() {
    try {
        ysdk.auth.openAuthDialog().then(() => {
            YandexInitPlayer();
        }).catch(() => {
            YandexAuthorizationCheck();
        });
    } catch {
        console.log('CRASH Open Auth Dialog: ');
    }
}

export function YandexStickyAdActivity(show) {
    try {
        ysdk.adv.getBannerAdvStatus().then(({ stickyAdvIsShowing, reason }) => {
            if (stickyAdvIsShowing) {
                if (!show) {
                    ysdk.adv.hideBannerAdv();
                }
            }
            else if (reason) {
                console.log('Sticky ad are not shown. Reason:', reason);
            }
            else if (show) {
                ysdk.adv.showBannerAdv();
            }
        });
    } catch (e) {
        console.error('CRASH Sticky Activity: ', e.message);
    }
}

export function YandexBuyPayments(id) {
    try {
        if (payments != null) {
            payments.purchase(id).then(purchase => {
                console.log(`Purchase Success ${id}`);
                myGameInstance.SendMessage('YandexPurchase', 'PurchaseSuccess', id);
                InitYandexPayments();
                window.focus();
            }).catch(e => {
                console.error(`Purchase Failed ${id}`, e.message);
                myGameInstance.SendMessage('YandexPurchase', 'PurchaseFailed', id);
                window.focus();
            });
        } else {
            console.log('Payments == null');
            myGameInstance.SendMessage('YandexPurchase', 'PurchaseFailed', id);
            window.focus();
        }
    } catch (e) {
        console.error('CRASH Buy Payments: ', e.message);
        myGameInstance.SendMessage('YandexPurchase', 'PurchaseFailed', id);
        window.focus();
    }
}


export function YandexGetPayments() {
    Sleep(timeWaitLoadData);
    if (inApp) {
        myGameInstance.SendMessage('YandexPurchase', 'InitPurchase', JSON.stringify(inApp));
    } else {
        myGameInstance.SendMessage('YandexPurchase', 'InitPurchase', "noInApp");

    }

    return true;
}

export function YandexDeletePurchase(id) {
    try {
        if (payments != null) {
            payments.getPurchases().then(purchases => {
                for (let i = 0; i < purchases.length; i++) {
                    if (purchases[i].productID === id)
                        payments.consumePurchase(purchases[i].purchaseToken);
                }
            });
        }
        else console.log('Delete Purchase: payments == null');
    } catch (e) {
        console.error('CRASH Delete Purchase: ', e.message);
    }
}

export function YandexDeleteAllPurchases() {
    try {
        if (payments != null) {
            payments.getPurchases().then(purchases => {
                for (let i = 0; i < purchases.length; i++) {
                    payments.consumePurchase(purchases[i].purchaseToken);
                }
            });
        }
        else console.log('Delete All Purchases: payments == null');
    } catch (e) {
        console.error('CRASH Delete All Purchases: ', e.message);
    }
}

function SaveLocal(jsonData) {
    localStorage.setItem(savesKey, lzw_encode(jsonData));
    localStorage.setItem(idSavesKey, localStorage.getItem(idSavesKey) ? localStorage.getItem(idSavesKey) + 1 : 0);
}

export async function YandexSaveCloud(jsonData, flush) {
    try {
        if (isSaveData) {
            const playerAuth = await window.ysdk.getPlayer({ scopes: false });

            if (playerAuth.getMode() === 'lite') {
                localStorage.setItem(savesKey, lzw_encode(jsonData));
            } else {
                localStorage.setItem(savesKey, lzw_encode(jsonData));

                let saveStr = lzw_encode(jsonData);

                playerAuth.setData({
                    saves: saveStr,
                }, flush);
            }
        }
    }
    catch (e) {
        console.error('CRASH Save Cloud: ', e.message);
        SaveLocal(jsonData);
        window.focus();
    }
}


async function InitLoadData() {
    try {
        const playerAuth = await ysdk.getPlayer({ scopes: false });
        if (playerAuth.getMode() === 'lite') {
            loadData = localStorage.getItem(savesKey) ? lzw_decode(decodeHtmlEntity(String(localStorage.getItem(savesKey)))) : noDataCloudKey;
        } else {
            const data = await playerAuth.getData([savesKey]);
            const dataLocal = localStorage.getItem(savesKey);

            if (data.saves) {
                loadData = lzw_decode(decodeHtmlEntity(String(data.saves)));
            }
            else if (dataLocal) {
                loadData = lzw_decode(decodeHtmlEntity(String(dataLocal)));
            } else {
                loadData = noDataCloudKey;
            }
        }
    } catch (e) {
        console.error('CRASH Load Cloud: ', e.message);
        loadData = localStorage.getItem(savesKey) ? lzw_decode(decodeHtmlEntity(String(localStorage.getItem(savesKey)))) : noDataCloudKey;
    }

    setTimeout(() => isSaveData = true, timeWaitSave);
}


export function YandexLoadCloud() {
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

export function YandexActivityBanner(isShow) {
    try {
        ysdk.adv.getBannerAdvStatus().then(({ stickyAdvIsShowing, reason }) => {
            if (stickyAdvIsShowing) {
                if (!isShow) {
                    ysdk.adv.hideBannerAdv();
                }
            }
            else if (reason) {
                console.log('Sticky ad are not shown. Reason:', reason);
            }
            else if (isShow) {
                ysdk.adv.showBannerAdv();
            }
        })
    } catch (e) {
        console.error('CRASH Sticky Activity: ', e.message);
    }
}

export function YandexRequestingEnvironmentData() {
    try {
        let jsonEnvir = {
            "language": ysdk.environment.i18n.lang,
            "domain": ysdk.environment.i18n.tld,
            "deviceType": ysdk.deviceInfo.type,
            "isMobile": ysdk.deviceInfo.isMobile(),
            "isDesktop": ysdk.deviceInfo.isDesktop(),
            "isTablet": ysdk.deviceInfo.isTablet(),
            "isTV": ysdk.deviceInfo.isTV(),
            "appID": ysdk.environment.app.id,
            "browserLang": ysdk.environment.browser.lang,
            "payload": ysdk.environment.payload,
            "promptCanShow": promptCanShow,
            "reviewCanShow": reviewCanShow
        };
        myGameInstance.SendMessage('YandexEnvironmentController', 'SetEnvironmentData', JSON.stringify(jsonEnvir));
    } catch (e) {
        console.error('CRASH Requesting Environment Data: ', e.message);
    }
}
