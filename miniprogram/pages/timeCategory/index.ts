import { getTimeSites } from '../../utils/service';

// 分类配色 —— 同时支持"单词"与"复合词"两套分类名（兼容新旧上报数据）
type CatCfg = { color: string; bgLight: string; icon: string; emoji: string };
const CAT_CONFIG: Record<string, CatCfg> = {
  // 单词版
  '工作':     { color: '#4B7BF5', bgLight: '#EBF0FF', icon: '/pages/assets/categories/work.svg',          emoji: '💼' },
  '学习':     { color: '#22B8CF', bgLight: '#E3FAFC', icon: '/pages/assets/categories/study.svg',         emoji: '📚' },
  '社交':     { color: '#FF6B6B', bgLight: '#FFF0F0', icon: '/pages/assets/categories/social.svg',        emoji: '📱' },
  '资讯':     { color: '#FFA94D', bgLight: '#FFF8EB', icon: '/pages/assets/categories/news.svg',          emoji: '📰' },
  '娱乐':     { color: '#A78BFA', bgLight: '#F5F0FF', icon: '', emoji: '🤳' },
  '工具':     { color: '#F59F00', bgLight: '#FFF4DB', icon: '/pages/assets/categories/tools.svg',         emoji: '🛠️' },
  '购物':     { color: '#34D399', bgLight: '#EDFBF4', icon: '/pages/assets/categories/shopping.svg',      emoji: '🛍️' },
  '其他':     { color: '#94A3B8', bgLight: '#F1F5F9', icon: '/pages/assets/categories/other.svg',         emoji: '🌐' },
  // 复合词版（旧 mock / 兼容）
  '工作/学习': { color: '#4B7BF5', bgLight: '#EBF0FF', icon: '/pages/assets/categories/work.svg',          emoji: '💼' },
  '社交媒体':  { color: '#FF6B6B', bgLight: '#FFF0F0', icon: '/pages/assets/categories/social.svg',        emoji: '📱' },
  '资讯/新闻': { color: '#FFA94D', bgLight: '#FFF8EB', icon: '/pages/assets/categories/news.svg',          emoji: '📰' },
  '视频/娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', icon: '', emoji: '🤳' },
};

// 基础 Tab（始终显示"所有"）；其余根据后端真实分类动态生成
const BASE_TABS = [
  { key: 'all', label: '所有', color: '#4B7BF5' },
];

function catLabel(name: string): string {
  // 复合分类名 → 首词作为 Tab 标签；单词直接返回
  if (name.includes('/')) return name.split('/')[0];
  return name;
}

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
    tabs: BASE_TABS,
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
    // 优先读 overview 页通过全局变量传来的日期 / 指定 tab，消费后清除
    const app = getApp<any>();
    const jumpDate = app.globalData?.timeCategoryDate;
    const jumpTab  = app.globalData?.timeCategoryTab;
    if (jumpDate) app.globalData.timeCategoryDate = null;
    if (jumpTab)  app.globalData.timeCategoryTab  = null;

    const date = jumpDate || this.data.selectedDate || todayStr();
    const updates: any = { selectedDate: date };
    if (jumpTab) {
      // 预先把 activeTab 设为目标分类；fetchData 完成后若该 tab 有效会被保留，
      // 失效则回退到"所有"
      updates.activeTab = jumpTab;
      updates.activeTabLabel = catLabel(jumpTab);
    }
    this.setData(updates);
    this.fetchData(date);
  },

  onDateChange(e: any) {
    const date = e.detail.date;
    this.setData({ selectedDate: date, loading: true, hasData: false });
    this.fetchData(date);
  },

  onPullDownRefresh() {
    this.fetchData(this.data.selectedDate);
  },

  onTabTap(e: any) {
    const key = e.currentTarget.dataset.key;
    const tab = (this.data.tabs as any[]).find((t: any) => t.key === key);
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

      // 根据真实数据动态构建 Tab：剔除 0 分钟分类、保持后端排序（时长倒序）
      const dynamicTabs = [
        ...BASE_TABS,
        ...cats
          .filter(c => c.minutes > 0)
          .map(c => {
            const cfg = CAT_CONFIG[c.name] || CAT_CONFIG['其他'];
            return { key: c.name, label: catLabel(c.name), color: cfg.color };
          }),
      ];

      // 若当前选中 Tab 不在新列表中，回退到"所有"
      const activeTabObj = dynamicTabs.find((t: any) => t.key === this.data.activeTab);
      const nextActive = activeTabObj ? activeTabObj.key : 'all';
      const nextLabel  = activeTabObj ? activeTabObj.label : '所有';

      this.setData({
        tabs: dynamicTabs,
        activeTab: nextActive,
        activeTabLabel: nextLabel,
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
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('[timeCategory] fetch error', err);
      this.setData({ loading: false, refreshing: false, hasData: false });
      wx.stopPullDownRefresh();
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
        catIcon: cfg.icon,
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
    // 用 selectorQuery 拿到 canvas 的实际 CSS 像素大小，避免在不同机型上偏心
    const doDraw = (w: number, h: number) => {
      const ctx = wx.createCanvasContext('donutCanvas', this);
      const cx = w / 2, cy = h / 2;
      // 线宽 + 圆角端点所占高度
      const lineW = Math.round(Math.min(w, h) * 0.13); // 约 13% 宽度
      const R = Math.min(w, h) / 2 - lineW / 2 - 2;    // 外沿留 2px 安全间距
      const gapRad = 0.035;

      // 1) 底轨
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.setStrokeStyle('#F1F3F7');
      ctx.setLineWidth(lineW);
      ctx.stroke();

      const visible = cats.filter(c => c.minutes > 0);
      if (!visible.length) { ctx.draw(); return; }

      const needGap = visible.length > 1;
      let startAngle = -Math.PI / 2;

      visible.forEach(cat => {
        const cfg = CAT_CONFIG[cat.name] || CAT_CONFIG['其他'];
        const rawSweep = (cat.minutes / total) * 2 * Math.PI;
        const gap = needGap ? gapRad : 0;
        const sweep = Math.max(rawSweep - gap, 0.01);
        const segStart = startAngle + (needGap ? gap / 2 : 0);
        const segEnd   = segStart + sweep;

        ctx.beginPath();
        ctx.arc(cx, cy, R, segStart, segEnd);
        ctx.setStrokeStyle(cfg.color);
        ctx.setLineWidth(lineW);
        ctx.setLineCap('round');
        ctx.stroke();

        startAngle += rawSweep;
      });

      ctx.draw();
    };

    // 等 canvas 渲染出现后再查询尺寸
    setTimeout(() => {
      wx.createSelectorQuery()
        .in(this as any)
        .select('#donutCanvas')
        .boundingClientRect((rect: any) => {
          if (rect && rect.width && rect.height) {
            doDraw(rect.width, rect.height);
          } else {
            // 降级：按常见 iPhone 基准 200rpx = 100px 估算（会略偏但不至于离谱）
            doDraw(120, 120);
          }
        })
        .exec();
    }, 50);
  },
});
