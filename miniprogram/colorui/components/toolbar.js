const app = getApp();

Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true,
  },

  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: {
      type: String,
      value: "",
    },
    isCustom: {
      type: Boolean,
      value: false,
    },
    isBack: {
      type: Boolean,
      value: false,
    },
    bgImage: {
      type: String,
      value: "",
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    appBarHeight: app.globalData.toolbarHeight + app.globalData.statusBarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    menu: app.globalData.menu,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      const pages = getCurrentPages();
      console.log(pages);
      if (pages.length === 1) {
        wx.reLaunch({
          url: "/pages/index/index",
        });
      } else {
        wx.navigateBack({
          delta: 1,
        });
      }
    },
    toHome() {
      wx.reLaunch({
        url: "/pages/index/index",
      });
    },
  },
});
