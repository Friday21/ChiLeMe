import { makeShareToFriend, makeShareToTimeline } from '../../../utils/share';

const API_HOST = 'https://django-emmn-114321-5-1327836217.sh.run.tcloudbase.com';
const REPO_URL = 'https://github.com/Friday21/activity-tracker';

Page({
  data: {
    openId: '',
    apiUrl: '',
    repoUrl: REPO_URL,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId') || '';

    const apiUrl = `${API_HOST}/api/time/upload/${openId || '{openId}'}/`;

    this.setData({ openId, apiUrl });
  },

  copyOpenId() {
    const { openId } = this.data;
    if (!openId) {
      wx.showToast({ title: '未登录', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: openId,
      success: () => wx.showToast({ title: 'openId 已复制', icon: 'success' }),
    });
  },

  copyApiUrl() {
    wx.setClipboardData({
      data: this.data.apiUrl,
      success: () => wx.showToast({ title: 'API 已复制', icon: 'success' }),
    });
  },

  // 小程序内无法直接打开外链，点击卡片时把仓库地址复制到剪贴板
  openRepo() {
    wx.setClipboardData({
      data: REPO_URL,
      success: () => wx.showToast({ title: '仓库地址已复制', icon: 'success' }),
    });
  },

  onShareAppMessage() {
    return makeShareToFriend({
      title: '如何上传数据到一日虚度',
      path:  '/pages/timeOverview/index',
    });
  },

  onShareTimeline() {
    return makeShareToTimeline({
      title: '一日虚度 · 时间去哪儿了',
    });
  },
});
