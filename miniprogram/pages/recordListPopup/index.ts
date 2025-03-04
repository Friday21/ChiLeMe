Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    date: {
      type: String,
      value: '',
      observer(newVal: string) {
        // 当 date 变化时，通知 record-list 组件重新加载
        if (this.selectComponent('#recordList')) {
          this.selectComponent('#recordList').fetchRecords(newVal);
        }
      }
    }
  },

  methods: {
    onClose() {
      this.setData({ show: false });
      setTimeout(() => {
        wx.navigateBack();
      }, 300);
    }
  }
});