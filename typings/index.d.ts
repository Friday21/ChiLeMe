/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    openId?: string,
    sessionId: string,
    userInfo?: object,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}