import { getRecordsByDate } from '../../utils/service';

Component({
  properties: {
    date: {
      type: String,
      value: ''
    }
  },

  data: {
    show: false,
    records: [],
    loading: false
  },

  lifetimes: {
    attached() {
      // 获取页面参数
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const date = currentPage.options.date;
      
      if (date) {
        this.setData({ 
          date,
          show: true 
        });
        this.loadRecordsByDate(date);
      }
    }
  },

  methods: {
    async loadRecordsByDate(date: string) {
      this.setData({ loading: true });
      try {
        const openId = wx.getStorageSync('openId');
        if (!openId) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        // 调用API获取指定日期的记录
        const records = await getRecordsByDate(openId, date);
        this.setData({ 
          records,
          loading: false
        });
      } catch (error) {
        console.error('加载记录失败：', error);
        wx.showToast({ 
          title: '加载失败', 
          icon: 'none' 
        });
        this.setData({ loading: false });
      }
    },

    onClose() {
      this.setData({ show: false });
      setTimeout(() => {
        wx.navigateBack();
      }, 300);
    }
  }
}); 