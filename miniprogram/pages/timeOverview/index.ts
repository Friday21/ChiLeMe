import { getTimeOverview, getTimeWeekTrend } from '../../utils/service';

// 分类配置（颜色、图标、背景）—— 单词版 + 旧复合词版兼容
type CatCfg = { color: string; bgLight: string; icon: string; emoji: string };
const CAT_CONFIG: Record<string, CatCfg> = {
  // 单词版（后端当前上报格式）
  '工作':     { color: '#4B7BF5', bgLight: '#EBF0FF', icon: '/pages/assets/categories/work.svg',          emoji: '💼' },
  '学习':     { color: '#22B8CF', bgLight: '#E3FAFC', icon: '/pages/assets/categories/study.svg',         emoji: '📚' },
  '社交':     { color: '#FF6B6B', bgLight: '#FFF0F0', icon: '/pages/assets/categories/social.svg',        emoji: '📱' },
  '资讯':     { color: '#FFA94D', bgLight: '#FFF8EB', icon: '/pages/assets/categories/news.svg',          emoji: '📰' },
  '娱乐':     { color: '#A78BFA', bgLight: '#F5F0FF', icon: '', emoji: '🤳' },
  '工具':     { color: '#F59F00', bgLight: '#FFF4DB', icon: '/pages/assets/categories/tools.svg',         emoji: '🛠️' },
  '购物':     { color: '#34D399', bgLight: '#EDFBF4', icon: '/pages/assets/categories/shopping.svg',      emoji: '🛍️' },
  '其他':     { color: '#94A3B8', bgLight: '#F1F5F9', icon: '/pages/assets/categories/other.svg',         emoji: '🌐' },
  // 旧复合词版（兼容 mock 数据）
  '工作/学习': { color: '#4B7BF5', bgLight: '#EBF0FF', icon: '/pages/assets/categories/work.svg',          emoji: '💼' },
  '社交媒体':  { color: '#FF6B6B', bgLight: '#FFF0F0', icon: '/pages/assets/categories/social.svg',        emoji: '📱' },
  '资讯/新闻': { color: '#FFA94D', bgLight: '#FFF8EB', icon: '/pages/assets/categories/news.svg',          emoji: '📰' },
  '视频/娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', icon: '', emoji: '🤳' },
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const TIME_AXIS = ['9', '11', '13', '15', '17', '19', '21'];

// Hero 卡片重点展示的三个分类
const FEATURED_CATS = [
  { key: '工作', emoji: '💼' },
  { key: '学习', emoji: '📚' },
  { key: '娱乐', emoji: '🤳' },
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function findCategoryMinutes(cats: Array<{ name: string; minutes: number }>, target: string): number {
  // 1) 精确匹配（生产环境后端上报简单名："工作"/"学习"/"娱乐"）
  const exact = cats.find(c => c.name === target);
  if (exact) return exact.minutes;
  // 2) 退化：复合名中包含目标词（mock 兼容："工作/学习"、"视频/娱乐"）
  const composite = cats.find(c => c.name.includes(target));
  if (composite) return composite.minutes;
  return 0;
}

function minutesToLabel(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function minutesToShort(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h`;
}

Page({
  data: {
    selectedDate: '',
    todayStr: '',
    loading: true,
    refreshing: false,
    hasData: false,
    summary: {
      hours: 0, minutes: 0,
      diffText: '', diffPositive: true,
    },
    featuredCats: [] as any[],
    insight: '',
    categories: [] as any[],
    timeline: [] as any[],
    timeAxis: TIME_AXIS,
    weekTrend: [] as any[],
  },

  onLoad() {
    const today = todayStr();
    this.setData({ selectedDate: today, todayStr: today });
    this.fetchAll(today);
  },

  onShow() {
    // Refresh when tab switched back
    if (this.data.selectedDate) {
      this.fetchAll(this.data.selectedDate);
    }
  },

  onPullDownRefresh() {
    this.fetchAll(this.data.selectedDate);
  },

  onDateChange(e: any) {
    const date = e.detail.date;
    this.setData({ selectedDate: date, loading: true, hasData: false });
    this.fetchAll(date);
  },

  onWeekTap(e: any) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date, loading: true, hasData: false });
    this.fetchAll(date);
  },

  goCategory() {
    // tabBar 页面不能用 navigateTo，改用 switchTab；日期通过全局变量传递
    const app = getApp<any>();
    app.globalData = app.globalData || {};
    app.globalData.timeCategoryDate = this.data.selectedDate;
    app.globalData.timeCategoryTab = null;
    wx.switchTab({ url: '/pages/timeCategory/index' });
  },

  onCategoryTap(e: any) {
    const name = e.currentTarget.dataset.name as string;
    // 若是列表里 0 分钟的分类，忽略（hero 卡片不受此限制，因为 hero 用的是简单分类名）
    const cat = (this.data.categories as any[]).find(c => c.name === name);
    if (cat && cat.percent === 0) return;
    const app = getApp<any>();
    app.globalData = app.globalData || {};
    app.globalData.timeCategoryDate = this.data.selectedDate;
    app.globalData.timeCategoryTab = name;
    wx.switchTab({ url: '/pages/timeCategory/index' });
  },

  fetchAll(date: string) {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) return;

    const yesterdayDate = addDays(date, -1);
    Promise.all([
      getTimeOverview(openId, date),
      getTimeWeekTrend(openId, date),
      // 昨天数据单独捕获异常：没有也不影响主流程
      getTimeOverview(openId, yesterdayDate).catch(() => null),
    ]).then(([overview, weekTrend, yesterdayOverview]) => {
      this._applyOverview(overview, date, yesterdayOverview);
      this._applyWeekTrend(weekTrend, date);
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('[timeOverview] fetch error', err);
      this.setData({ loading: false, refreshing: false, hasData: false });
      wx.stopPullDownRefresh();
    });
  },

  _applyOverview(data: any, date: string, yesterdayData?: any) {
    if (!data || !data.totalMinutes) {
      this.setData({ hasData: false });
      return;
    }

    const total = data.totalMinutes as number;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    // Build categories
    const rawCats: Array<{ name: string; minutes: number }> = data.categories || [];
    const yRawCats: Array<{ name: string; minutes: number }> = (yesterdayData && yesterdayData.categories) || [];

    // Hero 卡片：工作 / 学习 / 娱乐 今日 + 相比昨天
    const featuredCats = FEATURED_CATS.map(({ key, emoji }) => {
      const mins = findCategoryMinutes(rawCats, key);
      const yMins = findCategoryMinutes(yRawCats, key);
      const diff = mins - yMins;
      let diffText = '';
      let diffClass: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (yRawCats.length === 0) {
        // 昨天拉不到数据就不展示变化
        diffText = '';
      } else if (diff > 0) {
        diffText = `+${minutesToLabel(diff)} ↑`;
        diffClass = 'positive';
      } else if (diff < 0) {
        diffText = `-${minutesToLabel(-diff)} ↓`;
        diffClass = 'negative';
      } else {
        diffText = '持平';
        diffClass = 'neutral';
      }
      const cfg = CAT_CONFIG[key] || CAT_CONFIG['其他'];
      return {
        key,
        name: key,
        emoji,
        icon: cfg.icon,
        bgLight: cfg.bgLight,
        durationLabel: minutesToLabel(mins),
        diffText,
        diffClass,
      };
    });

    const categories = rawCats.map(cat => {
      const cfg = CAT_CONFIG[cat.name] || CAT_CONFIG['其他'];
      return {
        name: cat.name,
        icon: cfg.icon,
        emoji: cfg.emoji,
        color: cfg.color,
        bgLight: cfg.bgLight,
        durationLabel: minutesToLabel(cat.minutes),
        percent: total > 0 ? Math.round(cat.minutes / total * 100) : 0,
      };
    }).sort((a, b) => b.percent - a.percent);

    // Build timeline (24 hour slots 0–23)
    const hourlyMap: Record<number, { catName: string; minutes: number }[]> = data.hourly || {};
    const currentHour = new Date().getHours();
    const timeline = Array.from({ length: 24 }, (_, h) => {
      const slots = hourlyMap[h] || [];
      const dominant = slots.reduce((max, s) => s.minutes > (max?.minutes ?? 0) ? s : max, null as any);
      const cfg = dominant ? (CAT_CONFIG[dominant.catName] || CAT_CONFIG['其他']) : null;
      const totalMins = slots.reduce((s, x) => s + x.minutes, 0);
      const opacity = cfg ? Math.min(0.3 + totalMins / 60 * 0.7, 1) : 1;
      return {
        hour: h,
        color: cfg ? cfg.color : '#e8e8e8',
        opacity: slots.length ? opacity : 0.15,
        isNow: date === todayStr() && h === currentHour,
        active: slots.length > 0,
      };
    }).slice(8, 24); // Show 8:00–23:00

    const diff = data.diffMinutes as number;
    const diffText = diff === 0 ? '' :
      diff > 0 ? `比昨天多 ${minutesToLabel(Math.abs(diff))} ↑` :
                 `比昨天少 ${minutesToLabel(Math.abs(diff))} ↓`;

    this.setData({
      hasData: true,
      summary: {
        hours,
        minutes,
        diffText,
        diffPositive: diff >= 0,
      },
      featuredCats,
      insight: data.insight || '',
      categories,
      timeline,
    });
  },

  _applyWeekTrend(days: any[], selectedDate: string) {
    if (!days || !days.length) return;
    const maxMins = Math.max(...days.map((d: any) => d.totalMinutes || 0), 1);

    const weekTrend = days.map((d: any) => {
      const [, , dayNum] = d.date.split('-');
      const dateObj = new Date(d.date + 'T00:00:00');
      const dayLabel = WEEKDAY_LABELS[dateObj.getDay()];
      return {
        dateStr: d.date,
        dayLabel,
        isToday: d.date === todayStr(),
        isSelected: d.date === selectedDate,
        hasData: (d.totalMinutes || 0) > 0,
        heightPct: maxMins > 0 ? Math.round((d.totalMinutes || 0) / maxMins * 100) : 0,
        durationShort: minutesToShort(d.totalMinutes || 0),
      };
    });
    this.setData({ weekTrend });
  },
});
