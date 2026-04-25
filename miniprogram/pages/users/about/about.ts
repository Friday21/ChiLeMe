// pages/users/about/about.ts
import { makeShareToFriend, makeShareToTimeline } from '../../../utils/share';

const BLOG_URL = 'https://www.fridayhaohao.com/2026/04/25/%E6%97%B6%E9%97%B4%E5%8E%BB%E5%93%AA%E4%BA%86-%E7%BD%91%E4%B8%8A%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/';

Page({

  /**
   * Page initial data
   */
  data: {

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad() {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  goToBlog() {
    wx.navigateTo({
      url: `/pages/users/blog/blog?url=${encodeURIComponent(BLOG_URL)}&title=${encodeURIComponent('了解更多')}`,
      fail: () => {
        // 如果 webview 无法打开（一般是域名没在白名单里），降级到复制链接
        wx.setClipboardData({
          data: BLOG_URL,
          success: () => wx.showToast({ title: '链接已复制，浏览器打开', icon: 'none' }),
        });
      },
    });
  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {
    return makeShareToFriend({
      title: '关于一日虚度 · 记录时间去向',
      path:  '/pages/timeOverview/index',
    });
  },

  onShareTimeline() {
    return makeShareToTimeline({
      title: '一日虚度 · 时间去哪儿了',
    });
  },
})