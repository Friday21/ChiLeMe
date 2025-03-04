import { getHistory } from "../../utils/service";

interface DayData {
  date: string;
  positive: number;
  category: string;
}

const POSITIVE_COLOR = '#FFD580';
const NEGATIVE_COLOR = '#A0A0A0';
const NEUTRAL_COLOR = '#f7b733';

Component({
  data: {
    minDate: new Date(2025, 0, 1).getTime(),
    maxDate: (() => {
      const now = new Date();
      // 获取当前月份的最后一天
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
    })(),
    defaultDate: new Date().getTime(),
    moodData: {} as Record<string, DayData>,
    selectedDayCategories: [] as string[],
    formatter: null as unknown as (day: any) => any,
    todayColor: NEUTRAL_COLOR,
    showRecordList: false,
    selectedDate: ''
  },

  lifetimes: {
    async attached() {
      // 先加载数据
      await this.loadMoodData();

      // 再设置日期格式化函数
      const formatter = (day: any) => {
        const date = new Date(day.date);
        const dateStr = this.formatDate(date);
        const dayData = this.data.moodData[dateStr];

        if(dayData) {
          // 设置心情对应的颜色
          day.className = dayData.positive >= 3 ? POSITIVE_COLOR : NEGATIVE_COLOR;
          // 在日期下方显示分类
          day.bottomInfo = `${dayData.category}`;
        } 
        return day;
      };

      this.setData({ formatter });
    }
  },

  methods: {
    async loadMoodData() {
      try {
        const openId = wx.getStorageSync('openId');
        if (!openId) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        const records = await getHistory(openId);
        const moodData: Record<string, DayData> = {};

        // 处理心情数据
        records.forEach((record: any) => {
          // 直接使用后台返回的date，因为格式已经是YYYY-MM-DD
          moodData[record.date] = {
            date: record.date,
            positive: record.positive,
            category: record.category
          };
        });

        this.setData({ moodData });
        
        // 获取当前天的心情
        const currentDateStr = this.formatDate(new Date());
        const currentDayData = moodData[currentDateStr];
        if (currentDayData) {
          this.setData({ todayColor: currentDayData.positive >= 3 ? POSITIVE_COLOR : NEGATIVE_COLOR });
        } else {
          this.setData({ todayColor: NEUTRAL_COLOR });
        }
      } catch (error) {
        console.error('加载心情数据失败：', error);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    onSelect(event: WechatMiniprogram.CustomEvent) {
      const timestamp = event.detail as unknown as number;
      const dateStr = this.formatDate(new Date(timestamp));
      const dayData = this.data.moodData[dateStr];

      console.log('Selected date:', dateStr, 'Data:', dayData); // 添加日志

      this.setData({
        selectedDayCategories: dayData ? dayData.category : []
      });

      // 触发自定义事件
      this.triggerEvent('dayclick', { date: dateStr });
    },

    // 格式化日期
    formatDate(date: Date): string {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // 刷新数据
    refresh() {
      this.loadMoodData();
    },

    onDayClick(event: any) {
      const timestamp = event.detail as unknown as number;
      const dateStr = this.formatDate(new Date(timestamp));
      
      this.setData({
        showRecordList: true,
        selectedDate: dateStr
      });
    }
  }
}); 