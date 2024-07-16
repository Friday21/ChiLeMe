// index.ts
// 获取应用实例
import { getDinners, uploadDinner, likeDinner } from '../../utils/service';
const app = getApp<IAppOption>();

Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: 'https://www.creativefabrica.com/wp-content/uploads/2019/05/Add-icon-by-ahlangraphic-1-580x386.jpg', // 替换为实际的默认头像URL
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    dinners: [],
  },

  onPullDownRefresh: function () {
    var that = this;
    that.setData({
      dinners: [] //当前页的一些初始数据，视业务需求而定
    })
    this.onLoad(); //重新加载onLoad()
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
    getDinners(app.globalData.openId!).then(dinnerData => {
      this.setData({
        dinners: dinnerData
      });
    }).catch(err => {
      console.error('获取dinners失败:', err);
    });
  },

  onAddDinner() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType:['compressed'],  // 选择压缩图
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 假设我们已经有一个函数 uploadImage 处理上传
        this.uploadImage(tempFilePath).then((fileID: string) => {
          let newDinner = {
            location: 'Home',
            file_id: fileID,
            user_openId: app.globalData.openId,
          };
          uploadDinner(newDinner).then(dinner => {
            console.log('Upload successful', dinner);
            this.setData({dinners: [dinner, ...this.data.dinners]})
          }).catch(error => {
            console.error('Upload failed', error);
          });
        });
      }
    });
  },

  uploadImage(filePath: string) {
    const cloudPath = `images/${app.globalData.openId}/${new Date().getTime()}-${Math.floor(Math.random() * 1000)}.png`;
    
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath, // 云存储路径
        filePath, // 本地文件路径
        success: (res) => {
          console.log('上传成功', res);
          resolve(res.fileID); // 使用resolve返回结果
        },
        fail: (err) => {
          console.error('上传失败', err);
          reject(err); // 如果出错，使用reject传递错误
        },
      });
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


},
);
