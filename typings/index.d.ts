/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    openId?: string,
    sessionId: string,
    userInfo?: object,
    statusBarHeight?: Number,
    navigationBarHeight?: Number,
    windowWidth?: Number,
    toolbarHeight?: Number,
    menu?: any
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}