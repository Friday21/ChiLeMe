const app = getApp<IAppOption>();

interface PageItem {
  id: string;
  title: string;
  icon: string;
  iconActive: string;
}

const homeV2Enabled = true;

Page({
  data: {
    showingModal: null,
    currentTab: "record",
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,
    homeV2Enabled,
    pages: [
      {
        id: "history",
        title: "忆往昔",
        icon: "../assets/calendar_muted.png",
        iconActive: "../assets/calendar_active.png",
      },
      {
        id: "record",
        title: "记当下",
        icon: "../assets/mutemic.png",
        iconActive: "../assets/redmic.png",
      },
      {
        id: "report",
        title: "知虚度",
        icon: "../assets/report.png",
        iconActive: "../assets/report_active.png",
      },
      {
        id: "user",
        title: "Me",
        icon: "../assets/ic_user.png",
        iconActive: "../assets/ic_user_active.png",
      },
    ],
  },

  onLoad(options: Record<string, string>) {
    const { page, productId } = options;
    const { windowWidth, statusBarHeight } = app.globalData;

    if (productId) {
      wx.setStorageSync("shared_product_id", productId);
      this.setData({ currentTab: "mall" });
    }

    this.setData({
      tabWidth: windowWidth / (this.data.pages.length + 1),
      statusBarHeight,
    });

    if (page) {
      this.setData({ currentTab: page });
    }
  },

  onTabSelect(e: WechatMiniprogram.BaseEvent) {
    const currentTab = e.currentTarget.dataset.tabid as string;
    this.setData({ currentTab });
  },

  onShow() {
    if (app.globalData.pendingMessage) {
      wx.showToast({
        icon: "none",
        duration: 3000,
        title: app.globalData.pendingMessage,
      });
      app.globalData.pendingMessage = null;
    }
  },

  hideModal() {
    this.setData({ showingModal: null });
  },

  onShareAppMessage() {
    if (this.data.currentTab === "mall" && this.selectComponent("#mall")?.data.selectedProduct) {
      const mall = this.selectComponent("#mall")!;
      const product = mall.data.selectedProduct!;
      const titlePrefix = product.type === "sell" ? "来捡漏啦！" : "诚求！";
      const shareTitle = `${titlePrefix}${product.title}`;

      return {
        title: shareTitle,
        imageUrl: product.pictures?.[0],
        path: `/pages/index/index?page=mall&productId=${product._id}`,
      };
    }

    return {
      path: "/pages/index/index?page=" + this.data.currentTab,
    };
  },

  onShareTimeline() {
    return {
      query: "page=" + this.data.currentTab,
    };
  },
});