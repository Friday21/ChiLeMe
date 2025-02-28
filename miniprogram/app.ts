// app.ts
import { login } from './utils/service';

App<IAppOption>({
  globalData: {
    openId: "",   
    sessionId: "",
    userInfo: undefined,
    windowWidth: 0,

  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云环境
    wx.cloud.init({
      env: "prod-9g5b6d374032de85", // 替换为你的云开发环境ID
      traceUser: true,
    });

    // 尝试从本地存储中获取用户信息
    const storedUserInfo = wx.getStorageSync('userInfo');
    const storedOpenId = wx.getStorageSync('openId');
    const storedSessionId = wx.getStorageSync('sessionId');

    if (storedUserInfo && storedOpenId && storedSessionId) {
      // 本地存储中有用户信息，直接使用
      this.globalData.userInfo = storedUserInfo;
      this.globalData.openId = storedOpenId;
      this.globalData.sessionId = storedSessionId;
      console.log("User info loaded from storage:", this.globalData.userInfo);
    } else {
      // 本地存储中没有用户信息，进行登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          let body = {
            code: res.code
          };
          login(body).then(info => {
            console.log('login successful', info);
            this.globalData.openId = info.openId;
            this.globalData.sessionId = info.sessionId;
            if (info.userInfo) {
              this.globalData.userInfo = info.userInfo;
              console.log("get user", this.globalData.userInfo);
              
              // 将用户信息存储到本地
              wx.setStorageSync('userInfo', info.userInfo);
              wx.setStorageSync('openId', info.openId);
              wx.setStorageSync('sessionId', info.sessionId);
            }
          }).catch(error => {
            console.error('login failed', error);
          });
        },
      });
    };

    wx.getSystemInfo({
      success: (e) => {
        console.log(e);

        this.globalData.windowWidth = e.windowWidth;
        this.globalData.statusBarHeight = e.statusBarHeight;

        // Bottom navigation bar
        this.globalData.navigationBarHeight = e.screenHeight - e.safeArea.bottom;

        // Toolbar
        let menu = wx.getMenuButtonBoundingClientRect();
        this.globalData.menu = menu;
        this.globalData.toolbarHeight =  menu.height + (menu.top - e.statusBarHeight) * 2;
      },
    });
  },
})
