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

  data: {
    startX: 0, // 记录起始X坐标
    moveX: 0,  // 记录移动X坐标
  },

  methods: {
    onClose() {
      this.setData({ show: false });
      setTimeout(() => {
        wx.navigateBack();
      }, 300);
    },

    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        startX: e.touches[0].pageX,
      });
    },
  
    // 监听手势移动
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        moveX: e.touches[0].pageX,
      });
    },
  
    // 监听手势结束，判断是否左滑关闭
    onTouchEnd() {
      const { startX, moveX } = this.data;
      console.log(moveX - startX);
      if (moveX - startX < -50) {  // 左滑超过 50px 就关闭
        this.setData({ show: false });
      }
    },
  }
});