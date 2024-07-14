// index.ts
// 获取应用实例
import { getDinners } from '../../utils/service';

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
    dinners: []
  },

  onLoad: function() {
    console.log("on load");
    this.loadDinners();
    console.log("dinners", this.data.dinners)
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

  methods: {
    onAddDinner() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          // 假设我们已经有一个函数 uploadImage 处理上传
          this.uploadImage(tempFilePath).then((imageUrl) => {
            const newDinner = {
              imageUrl: imageUrl,
              time: "待定", // 根据实际情况设置
              location: "待定", // 根据实际情况设置
              likes: 0,
              taste: 0
            };
            this.setData({
              dinners: [...this.data.dinners, newDinner]
            });
          });
        }
      });
    },
  
    uploadImage(filePath: string): Promise<string> {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'https://example.com/upload', // 你的上传接口地址
          filePath: filePath,
          name: 'file',
          success: (res) => {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.url); // 假设服务器返回的图片地址在 data.url 中
            } else {
              reject('上传失败');
            }
          },
          fail: (err) => {
            reject(err);
          }
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
});
