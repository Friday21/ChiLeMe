import { createUser, addFriend, removeFriend, getFriend } from '../../utils/service';
import Toast from '@vant/weapp/toast/toast';

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
    sharedBy: '',  // 新增字段记录分享者的 openId
    sharedAlias: '',
  },
  onLoad: function (options) {
    if (options.sharerOpenId) {
      // 如果URL中有sharerOpenId参数，则表示是通过分享链接进入的
      console.log("Shared by:", options.sharerOpenId);
      this.setData({ sharedBy: options.sharerOpenId });
      this.setData({ sharedAlias: options.shareAlias})
      this.showAddFriendPopup();
    }

    this.waitForOpenId().then(openId => {
      console.log("openId is not ready now", openId);
      if (app.globalData.userInfo) {
        this.setData({
          "userInfo.avatarUrl": app.globalData.userInfo.avatar_url,
          "userInfo.nickName": app.globalData.userInfo.alias,
          hasUserInfo: true,
        });
      }
    }).catch(err => {
      console.error(err);
    });
  },

  waitForOpenId: function () {
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
    });
  },

  onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail;
    const { nickName } = this.data.userInfo;
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
  },

  onInputChange(e: any) {
    const nickName = e.detail.value;
    const { avatarUrl } = this.data.userInfo;
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
  },

  updateUserInfo(e: any) {
    let user = {
      "open_id": app.globalData.openId,
      "avatar_url": this.data.userInfo.avatarUrl,
      "alias": this.data.userInfo.nickName,
    };
    createUser(user).then(userInfo => {
      app.globalData.userInfo = userInfo;
      console.log("created user", app.globalData.userInfo);
      wx.setStorageSync('userInfo', userInfo);
      Toast.success('更新成功');
    });
  },

  showPopup() {
    console.log("pop up");
    wx.navigateTo({
      url: '../friends/friends',
    });
  },

  onClose() {
    this.setData({ showFriends: false });
  },

  // 分享功能
  onShareAppMessage: function () {
    return {
      title: '分享给朋友',
      path: `/pages/users/users?sharerOpenId=${app.globalData.openId}&shareAlias=${app.globalData.userInfo!.alias}`,
      success: function (res) {
        Toast.success('分享成功');
      },
      fail: function (res) {
        Toast.fail('分享失败');
      }
    };
  },

  showAddFriendPopup() {
    wx.showModal({
      title: '添加吃饭搭子',
      content: `是否添加${this.data.sharedAlias}为吃饭搭子?`,
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确认，处理添加逻辑
          let body = {
            user_openId: app.globalData.openId,
            friend_openId: this.data.sharedBy
          }
          addFriend(body).then(resp => {
            Toast.success('添加成功');
          });
        }
      }
    },
    )},


});
