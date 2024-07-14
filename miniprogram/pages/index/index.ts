// index.ts
// 获取应用实例
import { getDinners, uploadDinner } from '../../utils/service';

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

  onLoad: function() {
    console.log("on load");
    this.loadDinners();
  },

  loadDinners: function() {
    getDinners().then(dinnerData => {
      this.setData({
        dinners: dinnerData
      });
    }).catch(err => {
      console.error('获取dinners失败:', err);
    });
  },

  onAddDinner() {
    const app = getApp<IAppOption>();
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
    const cloudPath = `images/${new Date().getTime()}-${Math.floor(Math.random() * 1000)}.png`;
    
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

  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
},
);
