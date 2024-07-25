import { removeFriend, getFriend } from '../../utils/service';
const app = getApp<IAppOption>();

Page({
  data: {
    logs: [],
    friends: [],
  },

  onLoad: function() {
    getFriend(app.globalData.openId!).then(res => {
      this.setData({
        friends: res.friends,
      })
    })
  },

})
