import { getTimeSites } from '../../utils/service';

// 同时支持"单词版"与旧"复合词"分类名，未知分类统一走 其他
const CAT_CONFIG: Record<string, { color: string; bgLight: string; emoji: string }> = {
  // 单词版（后端当前上报格式）
  '工作':     { color: '#4B7BF5', bgLight: '#EBF0FF', emoji: '💼' },
  '学习':     { color: '#22B8CF', bgLight: '#E3FAFC', emoji: '📚' },
  '社交':     { color: '#FF6B6B', bgLight: '#FFF0F0', emoji: '📱' },
  '资讯':     { color: '#FFA94D', bgLight: '#FFF8EB', emoji: '📰' },
  '娱乐':     { color: '#A78BFA', bgLight: '#F5F0FF', emoji: '🎬' },
  '工具':     { color: '#F59F00', bgLight: '#FFF4DB', emoji: '🛠️' },
  '购物':     { color: '#34D399', bgLight: '#EDFBF4', emoji: '🛍️' },
  '其他':     { color: '#94A3B8', bgLight: '#F1F5F9', emoji: '🌐' },
  // 旧 mock 复合词版兼容
  '工作/学习': { color: '#4B7BF5', bgLight: '#EBF0FF', emoji: '💼' },
  '社交媒体':  { color: '#FF6B6B', bgLight: '#FFF0F0', emoji: '📱' },
  '资讯/新闻': { color: '#FFA94D', bgLight: '#FFF8EB', emoji: '📰' },
  '视频/娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', emoji: '🎬' },
};

// 分类展示优先级（总时长相同时按此顺序），未在列表中的追加到末尾
const CAT_PRIORITY = [
  '工作', '工作/学习',
  '学习',
  '社交', '社交媒体',
  '资讯', '资讯/新闻',
  '娱乐', '视频/娱乐',
  '工具',
  '购物',
  '其他',
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
    searchText: '',
    sortByTime: true,
    totalLabel: '',
    groups: [] as any[],
    filteredSites: [] as any[],
    showModal: false,
    activeSite: {} as any,
    _allSites: [] as any[],
  },

  onLoad(options: any) {
    const date = options.date || todayStr();
    this.setData({ selectedDate: date });
    this.fetchData(date);
  },

  onShow() {
    const date = this.data.selectedDate || todayStr();
    if (!this.data.selectedDate) {
      this.setData({ selectedDate: date });
    }
    this.fetchData(date);
  },

  onDateChange(e: any) {
    const date = e.detail.date;
    this.setData({ selectedDate: date, loading: true, hasData: false, searchText: '' });
    this.fetchData(date);
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.fetchData(this.data.selectedDate);
  },

  onSearch(e: any) {
    const text = e.detail.value as string;
    this.setData({ searchText: text });
    this._filterSites(text);
  },

  clearSearch() {
    this.setData({ searchText: '' });
    this._filterSites('');
  },

  toggleSort() {
    this.setData({ sortByTime: !this.data.sortByTime });
    this._buildAll(this.data._allSites);
  },

  onSiteTap(e: any) {
    const site = e.currentTarget.dataset.site;
    const hourly = site.hourly || [];
    const maxH = hourly.length ? Math.max(...hourly.map((h: any) => h.minutes), 1) : 1;
    const hourlyFormatted = hourly.map((h: any) => ({
      hour: String(h.hour).padStart(2, '0'),
      pct: Math.round(h.minutes / maxH * 100),
    }));

    const avgLabel = site.visits > 0
      ? minutesToLabel(Math.round((site.minutes || 0) / site.visits))
      : '—';

    this.setData({
      showModal: true,
      activeSite: { ...site, hourly: hourlyFormatted, avgLabel },
    });
  },

  closeModal() {
    this.setData({ showModal: false });
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

      const total = data.totalMinutes || 0;
      this.setData({
        hasData: true,
        loading: false,
        refreshing: false,
        totalLabel: minutesToLabel(total),
        _allSites: data.sites,
      });
      this._buildAll(data.sites);
    }).catch(err => {
      console.error('[timeSites] fetch error', err);
      this.setData({ loading: false, refreshing: false, hasData: false });
    });
  },

  _buildAll(rawSites: any[]) {
    const { sortByTime } = this.data;

    // Sort globally
    const sorted = [...rawSites].sort((a, b) =>
      sortByTime ? b.minutes - a.minutes : b.visits - a.visits
    );
    const maxMins = sorted.length ? sorted[0].minutes : 1;

    // Enrich each site
    const enriched = sorted.map((s, idx) => {
      const cfg = CAT_CONFIG[s.category] || CAT_CONFIG['其他'];
      return {
        ...s,
        rank: idx + 1,
        emoji: getSiteEmoji(s.domain),
        catColor: cfg.color,
        catBgLight: cfg.bgLight,
        durationLabel: minutesToLabel(s.minutes),
        barWidth: Math.round(s.minutes / maxMins * 100),
      };
    });

    // Group by category —— 根据真实数据动态建组，避免漏掉后端新分类
    const groupMap: Record<string, any[]> = {};
    enriched.forEach(s => {
      const cat = s.category || '其他';
      if (!groupMap[cat]) groupMap[cat] = [];
      groupMap[cat].push(s);
    });

    // 按 CAT_PRIORITY 排序，未在列表的分类按总时长降序追加到末尾
    const presentCats = Object.keys(groupMap);
    const ranked = presentCats
      .map(c => {
        const idx = CAT_PRIORITY.indexOf(c);
        const totalMins = groupMap[c].reduce((acc: number, s: any) => acc + (s.minutes || 0), 0);
        return { cat: c, idx: idx === -1 ? 9999 : idx, totalMins };
      })
      .sort((a, b) => {
        if (a.idx !== b.idx) return a.idx - b.idx;
        return b.totalMins - a.totalMins;
      });

    const groups = ranked.map(({ cat, totalMins }) => {
      const cfg = CAT_CONFIG[cat] || CAT_CONFIG['其他'];
      return {
        category: cat,
        color: cfg.color,
        totalLabel: minutesToLabel(totalMins),
        sites: groupMap[cat],
      };
    });

    this.setData({ groups, filteredSites: enriched });
  },

  _filterSites(text: string) {
    const lower = text.toLowerCase();
    const all = this.data._allSites as any[];
    if (!text) {
      this._buildAll(all);
      return;
    }

    const { sortByTime } = this.data;
    const filtered = all
      .filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.domain.toLowerCase().includes(lower)
      )
      .sort((a, b) => sortByTime ? b.minutes - a.minutes : b.visits - a.visits);

    const maxMins = filtered.length ? filtered[0].minutes : 1;
    const enriched = filtered.map((s, idx) => {
      const cfg = CAT_CONFIG[s.category] || CAT_CONFIG['其他'];
      return {
        ...s,
        rank: idx + 1,
        emoji: getSiteEmoji(s.domain),
        catColor: cfg.color,
        catBgLight: cfg.bgLight,
        durationLabel: minutesToLabel(s.minutes),
        barWidth: Math.round(s.minutes / maxMins * 100),
      };
    });

    this.setData({ filteredSites: enriched });
  },
});
