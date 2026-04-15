import { getTimeOverview, getTimeWeekTrend } from '../../utils/service';

// 分类配置（颜色、emoji、背景）
const CAT_CONFIG: Record<string, { color: string; bgLight: string; emoji: string }> = {
  '工作/学习': { color: '#4B7BF5', bgLight: '#EBF0FF', emoji: '💼' },
  '社交媒体':  { color: '#FF6B6B', bgLight: '#FFF0F0', emoji: '📱' },
  '资讯/新闻': { color: '#FFA94D', bgLight: '#FFF8EB', emoji: '📰' },
  '视频/娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', emoji: '🎬' },
  '购物':      { color: '#34D399', bgLight: '#EDFBF4', emoji: '🛍️' },
  '其他':      { color: '#94A3B8', bgLight: '#F1F5F9', emoji: '🌐' },
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const TIME_AXIS = ['9', '11', '13', '15', '17', '19', '21'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
      siteCount: 0, pageCount: 0, avgMinutes: 0,
      diffText: '', diffPositive: true,
    },
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

  onRefresh() {
    this.setData({ refreshing: true });
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
    wx.navigateTo({ url: `/pages/timeCategory/index?date=${this.data.selectedDate}` });
  },

  fetchAll(date: string) {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) return;

    Promise.all([
      getTimeOverview(openId, date),
      getTimeWeekTrend(openId, date),
    ]).then(([overview, weekTrend]) => {
      this._applyOverview(overview, date);
      this._applyWeekTrend(weekTrend, date);
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('[timeOverview] fetch error', err);
      this.setData({ loading: false, refreshing: false, hasData: false });
      wx.stopPullDownRefresh();
    });
  },

  _applyOverview(data: any, date: string) {
    if (!data || !data.totalMinutes) {
      this.setData({ hasData: false });
      return;
    }

    const total = data.totalMinutes as number;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    // Build categories
    const rawCats: Array<{ name: string; minutes: number }> = data.categories || [];
    const categories = rawCats.map(cat => {
      const cfg = CAT_CONFIG[cat.name] || CAT_CONFIG['其他'];
      return {
        name: cat.name,
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
        siteCount: data.siteCount || 0,
        pageCount: data.pageCount || 0,
        avgMinutes: data.avgMinutes || 0,
        diffText,
        diffPositive: diff >= 0,
      },
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
