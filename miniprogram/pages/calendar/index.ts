import { getRecords } from "../../utils/service";

interface DayData {
  date: string;
  positive: number;
  category: string;
}

// 模拟数据的分类选项
const MOCK_CATEGORIES = [
  '工作', '学习', '生活', '娱乐', '运动', 
  '家庭', '社交', '旅行', '美食', '购物'
];

Component({
  data: {
    minDate: new Date(2020, 0, 1).getTime(),
    maxDate: new Date().getTime(),
    defaultDate: new Date().getTime(),
    moodData: {} as Record<string, DayData>,
    selectedDayCategories: [] as string[],
    formatter: null as unknown as (day: any) => any
  },

  lifetimes: {
    attached() {
      // 初始化模拟数据
      this.initMockData();

      // 设置日期格式化函数
      const formatter = (day: any) => {
        const date = new Date(day.date);
        const dateStr = this.formatDate(date);
        const dayData = this.data.moodData[dateStr];

        
        if(dayData) {
          // 设置心情对应的类名
          day.className = `${dayData.positive >= 3 ? 'positive-mood' : 'negative-mood'}`;
          // 在日期下方显示分类
          day.bottomInfo = `${dayData.category}`;
        } 
        return day;
      };

      this.setData({ formatter });
    }
  },

  methods: {
    // 生成模拟数据
    initMockData() {
      const moodData: Record<string, DayData> = {};
      const today = new Date();

      // 生成最近10天的模拟数据
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = this.formatDate(date);

        // 随机生成2-4个分类
        const categoryCount = Math.floor(Math.random() * 3) + 2;
        const shuffledCategories = [...MOCK_CATEGORIES].sort(() => Math.random() - 0.5);
        const categories = shuffledCategories.slice(0, categoryCount);

        moodData[dateStr] = {
          date: dateStr,
          // 随机生成1-5之间的情绪值
          positive: Math.floor(Math.random() * 5) + 1,
          category: categories[0]
        };
      }

      console.log('Mock data generated:', moodData); // 添加日志
      this.setData({ moodData });
    },

    async loadMoodData() {
      try {
        const openId = wx.getStorageSync('openId');
        if (!openId) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        const records = await getRecords(openId);
        const moodData: Record<string, DayData> = {};

        // 处理心情数据
        records.forEach((record: any) => {
          const date = record.date.split('T')[0];
          moodData[date] = {
            date,
            positive: record.positive,
            category: record.category
          };
        });

        this.setData({ moodData });
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
    }
  }
}); 