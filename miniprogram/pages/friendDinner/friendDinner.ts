// index.ts
// 获取应用实例
import { getFriendDinners, likeDinner } from '../../utils/service';
const app = getApp<IAppOption>();

Page({
  data: {
    dinners: [],
  },

  onPullDownRefresh: function () {
    var that = this;
    that.setData({
      dinners: [] //当前页的一些初始数据，视业务需求而定
    })
    this.loadDinners(); //重新加载onLoad()
    wx.stopPullDownRefresh();
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

  updateDinner: function(dinner: object) {
    let updatedDinners = this.data.dinners.map(item => {
      if (item.id === dinner.id) {
        return dinner;
      } else {
        return item;
      }
    });
    this.setData({ dinners: updatedDinners });
  },

  rateHealthy(event: any) {
    let body = {
      from_openId: app.globalData.openId,
      dinner_id: event.currentTarget.dataset.id,
      healthy_star: event.detail,
    };
    console.log("body", body)
    likeDinner(body).then(dinner => {
      console.log('like dinner successful', dinner);
      this.updateDinner(dinner);
    }).catch(error => {
      console.error('Upload failed', error);
    });
  },

  rateDelicious(event: any) {
    let body = {
      from_openId: app.globalData.openId,
      dinner_id: event.currentTarget.dataset.id,
      delicious_star: event.detail,
    };
    likeDinner(body).then(dinner => {
      this.updateDinner(dinner);
    }).catch(error => {
      console.error('Upload failed', error);
    });
  },

  rateBeauty(event: any) {
    let body = {
      from_openId: app.globalData.openId,
      dinner_id: event.currentTarget.dataset.id,
      beauty_star: event.detail,
    };
    likeDinner(body).then(dinner => {
      this.updateDinner(dinner);
    }).catch(error => {
      console.error('Upload failed', error);
    });
  },
  preview(event: any) {
    let currentUrl = event.currentTarget.dataset.src
    wx.previewImage({
      current: currentUrl, // 当前显示图片的http链接
      urls: [currentUrl] // 需要预览的图片http链接列表
    })
  },

},
);
