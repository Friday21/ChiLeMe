import { getProfileData } from '../../utils/service';
import { makeShareToFriend, makeShareToTimeline } from '../../utils/share';

const USE_MOCK_KEY = 'useMockData';

function readUseMock(): boolean {
  const pref = wx.getStorageSync(USE_MOCK_KEY);
  if (pref === '' || pref === null || pref === undefined) return true;
  return pref === true;
}

Page({
  data: {
    userInfo: {},
    useMock: true,
    showEditPopup: false,
    tempUserInfo: {
      avatar: '',
      name: ''
    }
  },
  onLoad() {
    this.setData({ useMock: readUseMock() });
    this.fetchData();
  },
  onShow() {
    // 从别处返回时同步一下开关（比如被其他入口改过）
    this.setData({ useMock: readUseMock() });
  },
  onToggleMock(e: any) {
    const val = !!e.detail.value;
    wx.setStorageSync(USE_MOCK_KEY, val);
    this.setData({ useMock: val });
    wx.showToast({
      title: val ? '已切换到 Mock' : '已切换到真实数据',
      icon: 'none',
      duration: 1200,
    });
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
  },

  // Navigate to upload help page
  goToHowToUpload() {
    wx.navigateTo({ url: '/pages/users/howToUpload/howToUpload' });
  },

  onShareAppMessage() {
    return makeShareToFriend({
      title: '用一日虚度记录你的时间去向',
      path:  '/pages/timeOverview/index',
    });
  },

  onShareTimeline() {
    return makeShareToTimeline({
      title: '一日虚度 · 时间去哪儿了',
    });
  },
})