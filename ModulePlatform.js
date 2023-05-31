import { InitVk, VkPreloadReward, VkPreloadInterstitial, VkShowReward, VkShowInterstitial, VkLoadCloud, VkSaveCloud, VkInviteFriends  } from './ModuleVk.js';



export let functionApi = new Map();

export const platform = "vk";

export const functionApiKeys = Object.freeze({
    InitSDK: Symbol("initSdk"),
    PreloadReward: Symbol("preloadReward"),
    PreloadInterstitial: Symbol("preloadInterrstitial"),
    ShowReward: Symbol("showReward"),
    ShowInterstitial: Symbol("showInterstitial"),
    BuyInApp: Symbol("buyInApp"),
    GetInApp: Symbol("getInApp"),
    DeleteInApp: Symbol("deleteInApp"),
    DeleteAllInApp: Symbol("deleteAllInApp"),
    AuthCheck: Symbol("authCheck"),
    OpenAuthDialog: Symbol("openAuthDialog"),
    SaveGameCloud: Symbol("saveGameCloud"),
    LoadGameCloud: Symbol("loadGameCloud"),
    EnviromentData: Symbol("enviromentData"),
    InitPurchase: Symbol("initPurchase"),
    InviteFriends: Symbol("inviteFriends"),
});

export function InitMapFunctionApi()
{

    functionApi.set(functionApiKeys.InitSDK, InitVk);
    functionApi.set(functionApiKeys.PreloadReward, VkPreloadReward);
    functionApi.set(functionApiKeys.PreloadInterstitial, VkPreloadInterstitial);
    functionApi.set(functionApiKeys.ShowInterstitial, VkShowInterstitial);
    functionApi.set(functionApiKeys.ShowReward, VkShowReward);
    functionApi.set(functionApiKeys.SaveGameCloud, VkSaveCloud);
    functionApi.set(functionApiKeys.LoadGameCloud, VkLoadCloud);
    functionApi.set(functionApiKeys.InviteFriends, VkInviteFriends);



}
