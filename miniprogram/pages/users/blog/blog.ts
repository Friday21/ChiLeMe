// pages/users/blog/blog.ts
// 通用 web-view 页面：通过 query 参数传入 url 与可选的标题
// 用法：wx.navigateTo({ url: '/pages/users/blog/blog?url=' + encodeURIComponent(target) + '&title=' + encodeURIComponent('了解更多') })

Page({
  data: {
    url: '',
  },

  onLoad(query: any) {
    const raw = (query && query.url) ? decodeURIComponent(query.url) : '';
    const title = (query && query.title) ? decodeURIComponent(query.title) : '了解更多';

    if (!raw) {
      wx.showToast({ title: '链接为空', icon: 'none' });
      return;
    }

    wx.setNavigationBarTitle({ title });
    this.setData({ url: raw });
  },

  onWebError(e: any) {
    console.error('[blog web-view] load error', e && e.detail);
    wx.showModal({
      title: '无法打开页面',
      content: '请到小程序后台「业务域名」里把博客域名加入白名单，或者用浏览器打开链接。',
      showCancel: false,
    });
  },

  onWebLoad() {
    // no-op
  },
});
