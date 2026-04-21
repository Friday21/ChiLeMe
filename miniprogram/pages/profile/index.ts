import { getProfileData } from '../../utils/service';

Page({
  data: {
    userInfo: {},
    showEditPopup: false,
    tempUserInfo: {
      avatar: '',
      name: ''
    }
  },
  onLoad() {
    this.fetchData();
  },
  fetchData() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) {
      console.error('OpenID not found');
      return;
    }
    getProfileData(openId).then(data => {
      this.setData({
        userInfo: data.userInfo,
      });
    });
  },
  
  // Edit Profile
  editProfile() {
    this.setData({
      showEditPopup: true,
      tempUserInfo: { ...this.data.userInfo }
    });
  },
  onCloseEditPopup() {
    this.setData({ showEditPopup: false });
  },
  onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail;
    this.setData({
      'tempUserInfo.avatar': avatarUrl
    });
  },
  onNameChange(e: any) {
    this.setData({
      'tempUserInfo.name': e.detail
    });
  },
  onNameBlur(e: any) {
    this.setData({
      'tempUserInfo.name': e.detail.value
    });
  },
  saveProfile() {
    wx.showLoading({ title: '保存中' });
    // Simulate API call
    setTimeout(() => {
      this.setData({
        userInfo: { ...this.data.tempUserInfo },
        showEditPopup: false
      });
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
    }, 500);
  },

  // Navigate to about page
  goToAbout() {
    wx.navigateTo({ url: '/pages/users/about/about' });
  }
})