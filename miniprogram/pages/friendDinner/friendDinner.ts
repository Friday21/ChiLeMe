// index.ts
// 获取应用实例
import { getFriendDinners } from '../../utils/service';
const app = getApp<IAppOption>();

Page({
  data: {
    dinners: [],
  },

  onLoad: function() {
    this.waitForOpenId().then(openId => {
      console.log("openId is not now", openId)
      this.loadDinners();
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

  loadDinners: function() {
    getFriendDinners(app.globalData.openId!).then(dinnerData => {
      this.setData({
        dinners: dinnerData
      });
    }).catch(err => {
      console.error('获取dinners失败:', err);
    });
  },
},
);
