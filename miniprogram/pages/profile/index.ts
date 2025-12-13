import { getProfileData } from '../../utils/service';

Page({
  data: {
    userInfo: {},
    settings: {
      currency: '',
      startDate: '',
      includeRealEstate: true
    },
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
    getProfileData().then(data => {
      const includeRealEstate = wx.getStorageSync('includeRealEstate') ?? true;
      this.setData({
        userInfo: data.userInfo,
        settings: {
          ...data.settings,
          includeRealEstate: includeRealEstate
        }
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

  // Settings
  onToggleRealEstate(e: any) {
    const value = e.detail;
    this.setData({
      'settings.includeRealEstate': value
    });
    wx.setStorageSync('includeRealEstate', value);
  },
  goToAbout() {
    wx.showModal({
      title: '关于 ChiLeMe',
      content: '这是一个帮助你管理个人财务的小程序。\n版本: 1.0.0',
      showCancel: false
    });
  }
})