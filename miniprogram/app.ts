// app.ts
import { login } from './utils/service';

App<IAppOption>({
  globalData: {
    openId: "",   // 添加openId属性
    sessionId: "",
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // init cloud
    wx.cloud.init({
      env: "prod-9g5b6d374032de85", // 替换为你的云开发环境ID
      traceUser: true,
    });

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        let body = {
          code: res.code
        };
        login(body).then(info => {
          console.log('login successful', info);
          this.globalData.openId = info.openId;
          this.globalData.sessionId = info.sessionId;
        }).catch(error => {
          console.error('login failed', error);
        });
      },
    })
  },
})