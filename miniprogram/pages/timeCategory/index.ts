import { getTimeSites } from '../../utils/service';

const CAT_CONFIG: Record<string, { color: string; bgLight: string; emoji: string }> = {
  '工作/学习': { color: '#4B7BF5', bgLight: '#EBF0FF', emoji: '💼' },
  '社交媒体':  { color: '#FF6B6B', bgLight: '#FFF0F0', emoji: '📱' },
  '资讯/新闻': { color: '#FFA94D', bgLight: '#FFF8EB', emoji: '📰' },
  '视频/娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', emoji: '🎬' },
  '购物':      { color: '#34D399', bgLight: '#EDFBF4', emoji: '🛍️' },
  '其他':      { color: '#94A3B8', bgLight: '#F1F5F9', emoji: '🌐' },
};

const ALL_TABS = [
  { key: 'all',    label: '所有',    color: '#4B7BF5' },
  { key: '工作/学习', label: '工作',  color: '#4B7BF5' },
  { key: '社交媒体',  label: '社交',  color: '#FF6B6B' },
  { key: '资讯/新闻', label: '资讯',  color: '#FFA94D' },
  { key: '视频/娱乐', label: '娱乐',  color: '#A78BFA' },
  { key: '购物',      label: '购物',  color: '#34D399' },
];

const SITE_EMOJIS: Record<string, string> = {
  'claude.ai': '🤖', 'github.com': '🐙', 'youtube.com': '🔴',
  'weibo.com': '📘', 'twitter.com': '🐦', 'x.com': '🐦',
  'sspai.com': '📰', 'google.com': '🔍', 'taobao.com': '🛍️',
  'zhihu.com': '💬', 'bilibili.com': '📺', 'jd.com': '🛒',
  'v2ex.com': '💻', 'producthunt.com': '🚀',
};

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

function getSiteEmoji(domain: string): string {
  for (const key of Object.keys(SITE_EMOJIS)) {
    if (domain.includes(key)) return SITE_EMOJIS[key];
  }
  return '🌐';
}

Page({
  data: {
    selectedDate: '',
    loading: true,
    refreshing: false,
    hasData: false,
    tabs: ALL_TABS,
    activeTab: 'all',
    activeTabLabel: '所有',
    sortByTime: true,
    totalLabel: '',
    displayCategories: [] as any[],
    sites: [] as any[],
    // raw data
    _allSites: [] as any[],
    _categories: [] as any[],
    _totalMinutes: 0,
  },

  onLoad(options: any) {
    const date = options.date || todayStr();
    this.setData({ selectedDate: date });
    this.fetchData(date);
  },

  onShow() {
    // Tab 切回时刷新（selectedDate 已有值则直接用，否则用今天）
    const date = this.data.selectedDate || todayStr();
    if (!this.data.selectedDate) {
      this.setData({ selectedDate: date });
    }
    this.fetchData(date);
  },

  onDateChange(e: any) {
    const date = e.detail.date;
    this.setData({ selectedDate: date, loading: true, hasData: false });
    this.fetchData(date);
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.fetchData(this.data.selectedDate);
  },

  onTabTap(e: any) {
    const key = e.currentTarget.dataset.key;
    const tab = ALL_TABS.find(t => t.key === key);
    this.setData({ activeTab: key, activeTabLabel: tab?.label || '所有' });
    this._buildDisplay();
  },

  toggleSort() {
    this.setData({ sortByTime: !this.data.sortByTime });
    this._buildDisplay();
  },

  onLegendTap(e: any) {
    const key = e.currentTarget.dataset.key;
    this.onTabTap({ currentTarget: { dataset: { key } } });
  },

  goSiteDetail(e: any) {
    const domain = e.currentTarget.dataset.domain;
    wx.navigateTo({
      url: `/pages/timeSites/index?date=${this.data.selectedDate}&domain=${domain}`,
    });
  },

  fetchData(date: string) {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) return;

    getTimeSites(openId, date).then((data: any) => {
      if (!data || !data.sites || !data.sites.length) {
        this.setData({ loading: false, refreshing: false, hasData: false });
        return;
      }

      const cats: Array<{ name: string; minutes: number }> = data.categories || [];
      const total = data.totalMinutes || 0;

      this.setData({
        _allSites: data.sites,
        _categories: cats,
        _totalMinutes: total,
        hasData: true,
        loading: false,
        refreshing: false,
        totalLabel: minutesToLabel(total),
      });

      this._buildDisplay();
      this._drawDonut(cats, total);
    }).catch(err => {
      console.error('[timeCategory] fetch error', err);
      this.setData({ loading: false, refreshing: false, hasData: false });
    });
  },

  _buildDisplay() {
    const { activeTab, sortByTime, _allSites, _categories, _totalMinutes } = this.data;

    // Filter sites by active tab
    let sites = _allSites as any[];
    if (activeTab !== 'all') {
      sites = sites.filter((s: any) => s.category === activeTab);
    }

    // Sort
    sites = [...sites].sort((a: any, b: any) =>
      sortByTime ? b.minutes - a.minutes : b.visits - a.visits
    );

    const maxMins = sites.length ? sites[0].minutes : 1;

    const siteItems = sites.map((s: any) => {
      const cfg = CAT_CONFIG[s.category] || CAT_CONFIG['其他'];
      return {
        name: s.name,
        domain: s.domain,
        emoji: getSiteEmoji(s.domain),
        category: s.category,
        catColor: cfg.color,
        catBgLight: cfg.bgLight,
        durationLabel: minutesToLabel(s.minutes),
        visits: s.visits,
        barWidth: Math.round(s.minutes / maxMins * 100),
      };
    });

    // Category legend
    const displayCategories = (_categories as any[]).map(cat => {
      const cfg = CAT_CONFIG[cat.name] || CAT_CONFIG['其他'];
      return {
        key: cat.name,
        name: cat.name,
        color: cfg.color,
        durationLabel: minutesToLabel(cat.minutes),
        percent: _totalMinutes > 0 ? Math.round(cat.minutes / _totalMinutes * 100) : 0,
      };
    });

    this.setData({ sites: siteItems, displayCategories });
  },

  _drawDonut(cats: Array<{ name: string; minutes: number }>, total: number) {
    if (!total) return;
    const ctx = wx.createCanvasContext('donutCanvas', this);
    const cx = 100, cy = 100, r = 75, lineW = 22;
    let startAngle = -Math.PI / 2;

    cats.forEach(cat => {
      const cfg = CAT_CONFIG[cat.name] || CAT_CONFIG['其他'];
      const sweep = (cat.minutes / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.setStrokeStyle(cfg.color);
      ctx.setLineWidth(lineW);
      ctx.stroke();
      startAngle += sweep;
    });

    ctx.draw();
  },
});
