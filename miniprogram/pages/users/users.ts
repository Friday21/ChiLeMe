// index.ts
// 获取应用实例
import { createUser } from '../../utils/service';

const app = getApp<IAppOption>();
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    showFriends: false,
  },
  onLoad: function() {
    this.waitForOpenId().then(openId => {
      console.log("openId is not now", openId)
      if (app.globalData.userInfo) {
        this.setData({
          "userInfo.avatarUrl": app.globalData.userInfo.avatar_url,
          "userInfo.nickName": app.globalData.userInfo.alias,
          hasUserInfo: true,
        })
      }
    }).catch(err => {
      console.error(err);
    });
  },

  waitForOpenId: function() {
    return new Promise((resolve, reject) => {
      const maxWaitTime = 30000;  // Maximum wait time is 30s
      let waitedTime = 0;

      // Check openId every 100ms
      let checkInterval = setInterval(() => {
        if (app.globalData.openId) {
          clearInterval(checkInterval);
          resolve(app.globalData.openId);
        } else {
          waitedTime += 100;
          if (waitedTime >= maxWaitTime) {
            clearInterval(checkInterval);
            reject('waitForOpenId timeout');
          }
        }
      }, 100);
    });
  },

    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      })
    },

    onChooseAvatar(e: any) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e: any) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },

    updateUserInfo(e: any) {
      let user = {
        "open_id": app.globalData.openId,
        "avatar_url": this.data.userInfo.avatarUrl,
        "alias": this.data.userInfo.nickName,
      }
      createUser(user).then(userInfo => {
        app.globalData.userInfo = userInfo;
        console.log("created user", app.globalData.userInfo)
      })
    },

    showPopup() {
      console.log("pop up");
      wx.navigateTo({
        url: '../friends/friends',
      })
    },
  
    onClose() {
      this.setData({ showFriends: false });
    },


})