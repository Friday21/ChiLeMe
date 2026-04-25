/**
 * mockData.ts — 时间追踪功能的本地 Mock 数据
 *
 * 配合 service.ts 使用：非白名单 openId 自动走 mock，方便其他用户体验。
 * 所有函数签名与真实 API 保持一致，直接替换调用。
 *
 * 数据模型遵循最新后端：
 *   - 分类单词版：工作 / 学习 / 娱乐 / 睡眠 / 社交 / 资讯 / 工具 / 购物 / 其他
 *   - sites 每条含 startTime / endTime（ISO naive UTC+8）
 *   - week trend 为过去 7 天（含 pivot 当天），按分类拆分
 */

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return fmtDate(new Date());
}

/** 模拟网络延迟（80–200ms） */
function delay<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), 80 + Math.random() * 120));
}

/** 稳定的 pseudo-random（同 seed 出同结果） */
function rand01(seed: number): number {
  return (((seed * 2654435761) >>> 0) % 10000) / 10000;
}

/** 带 ±range 百分比扰动 */
function jitter(base: number, seed: number, range: number = 0.2): number {
  return Math.max(0, Math.round(base * (1 - range + rand01(seed) * range * 2)));
}

/** 根据日期生成一个稳定的 seed */
function dateSeed(dateStr: string): number {
  return dateStr.split('-').reduce((acc, s) => acc + parseInt(s, 10) * 31, 0);
}

/** ISO naive UTC+8 字符串 (YYYY-MM-DDTHH:MM:SS) */
function isoNaive(dateStr: string, hour: number, minute: number = 0, second: number = 0): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:${ss}`;
}

/** 日期字符串加 N 天 */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return fmtDate(dt);
}

// ─────────────────────────────────────────────
// 分类基线（分钟）—— 符合现代打工人一天
// ─────────────────────────────────────────────

type CatBase = { name: string; base: number };
const CATEGORIES: CatBase[] = [
  { name: '睡眠', base: 460 },  // ~7.7h
  { name: '工作', base: 310 },  // ~5.2h
  { name: '娱乐', base: 150 },  // ~2.5h
  { name: '学习', base: 70  },  // ~1.2h
  { name: '社交', base: 55  },
  { name: '资讯', base: 40  },
  { name: '工具', base: 25  },
  { name: '购物', base: 15  },
];

function dailyCategoryMinutes(dateStr: string): Record<string, number> {
  const seed = dateSeed(dateStr);
  const out: Record<string, number> = {};
  CATEGORIES.forEach((c, i) => {
    // 不同分类不同扰动幅度
    const range = c.name === '睡眠' ? 0.12 : 0.28;
    out[c.name] = jitter(c.base, seed + i * 97, range);
  });
  // 周末减工作加娱乐
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  if (wd === 0 || wd === 6) {
    out['工作']  = Math.round((out['工作']  || 0) * 0.25);
    out['学习']  = Math.round((out['学习']  || 0) * 0.6);
    out['娱乐']  = Math.round((out['娱乐']  || 0) * 1.6);
    out['购物']  = Math.round((out['购物']  || 0) * 2.2);
    out['睡眠']  = Math.round((out['睡眠']  || 0) * 1.1);
  }
  return out;
}

// ─────────────────────────────────────────────
// 网站池
// ─────────────────────────────────────────────

type SiteBase = {
  name: string; domain: string; category: string;
  share: number;    // 该分类下相对权重
  visits: number;   // 基准访问次数
  // 该站点在一天中的活跃时段（小时），决定 hourly + startTime/endTime
  hours: number[];
  // 上报时用的 detail 字段（URL 或 App 包名）—— 用来匹配品牌图标
  detail?: string;
};

const SITES_POOL: SiteBase[] = [
  // 工作
  { name: 'Claude',         domain: 'claude.ai',            category: '工作', share: 0.35, visits: 28, hours: [10, 11, 14, 15, 16],        detail: 'https://claude.ai/' },
  { name: 'GitHub',         domain: 'github.com',           category: '工作', share: 0.28, visits: 22, hours: [10, 11, 14, 15, 16, 17],    detail: 'https://github.com/' },
  { name: 'Notion',         domain: 'notion.so',            category: '工作', share: 0.12, visits: 15, hours: [9, 10, 14, 16],             detail: 'https://www.notion.so/' },
  { name: 'Linear',         domain: 'linear.app',           category: '工作', share: 0.10, visits: 9,  hours: [10, 14, 17],                detail: 'https://linear.app/' },
  { name: 'Figma',          domain: 'figma.com',            category: '工作', share: 0.08, visits: 7,  hours: [11, 15, 16],                detail: 'https://www.figma.com/' },
  { name: 'Stack Overflow', domain: 'stackoverflow.com',    category: '工作', share: 0.07, visits: 6,  hours: [11, 14, 17],                detail: 'https://stackoverflow.com/' },

  // 学习
  { name: '少数派',          domain: 'sspai.com',            category: '学习', share: 0.45, visits: 6,  hours: [12, 21],                    detail: 'https://sspai.com/' },
  { name: 'Hacker News',    domain: 'news.ycombinator.com', category: '学习', share: 0.30, visits: 10, hours: [12, 20, 22],                detail: 'https://news.ycombinator.com/' },
  { name: '得到',            domain: 'dedao.cn',             category: '学习', share: 0.25, visits: 4,  hours: [8, 22],                     detail: 'https://www.dedao.cn/' },

  // 娱乐 —— 品牌站点都带上 detail，好让图标命中
  { name: '抖音',            domain: 'douyin.com',           category: '娱乐', share: 0.24, visits: 26, hours: [12, 13, 19, 20, 21, 22],    detail: 'com.ss.android.ugc.aweme' },
  { name: 'bilibili',       domain: 'bilibili.com',         category: '娱乐', share: 0.20, visits: 11, hours: [12, 13, 20, 21, 22],        detail: 'https://www.bilibili.com/' },
  { name: 'YouTube',        domain: 'youtube.com',          category: '娱乐', share: 0.18, visits: 9,  hours: [12, 13, 19, 20, 21],        detail: 'https://www.youtube.com/' },
  { name: '小红书',          domain: 'xiaohongshu.com',      category: '娱乐', share: 0.12, visits: 14, hours: [13, 19, 22],                detail: 'https://www.xiaohongshu.com/' },
  { name: '网易云音乐',       domain: 'music.163.com',        category: '娱乐', share: 0.10, visits: 6,  hours: [10, 14, 17, 21],            detail: 'com.netease.cloudmusic' },
  { name: '腾讯视频',         domain: 'v.qq.com',             category: '娱乐', share: 0.08, visits: 4,  hours: [20, 21, 22],                detail: 'com.tencent.qqlive' },
  { name: '爱奇艺',          domain: 'iqiyi.com',            category: '娱乐', share: 0.05, visits: 3,  hours: [20, 21, 22],                detail: 'com.qiyi.video' },
  { name: 'QQ 音乐',         domain: 'y.qq.com',             category: '娱乐', share: 0.03, visits: 3,  hours: [9, 17, 21],                 detail: 'com.tencent.qqmusic' },

  // 睡眠
  { name: '睡眠',           domain: 'sleep',                category: '睡眠', share: 1.0,  visits: 1,  hours: [23, 0, 1, 2, 3, 4, 5, 6] },

  // 社交
  { name: '微信',            domain: 'weixin.qq.com',        category: '社交', share: 0.45, visits: 62, hours: [9, 10, 12, 13, 18, 20, 22], detail: 'com.tencent.mm' },
  { name: 'X',              domain: 'x.com',                category: '社交', share: 0.25, visits: 18, hours: [9, 12, 18, 22],             detail: 'https://x.com/' },
  { name: '微博',            domain: 'weibo.com',            category: '社交', share: 0.20, visits: 12, hours: [12, 18, 21],                detail: 'https://weibo.com/' },
  { name: 'Reddit',         domain: 'reddit.com',           category: '社交', share: 0.10, visits: 5,  hours: [12, 20],                    detail: 'https://www.reddit.com/' },

  // 资讯
  { name: 'V2EX',           domain: 'v2ex.com',             category: '资讯', share: 0.40, visits: 8,  hours: [12, 18, 22],                detail: 'https://www.v2ex.com/' },
  { name: '知乎',            domain: 'zhihu.com',            category: '资讯', share: 0.35, visits: 7,  hours: [13, 20],                    detail: 'https://www.zhihu.com/' },
  { name: 'Product Hunt',   domain: 'producthunt.com',      category: '资讯', share: 0.25, visits: 4,  hours: [10, 22],                    detail: 'https://www.producthunt.com/' },

  // 工具
  { name: 'Google',         domain: 'google.com',           category: '工具', share: 0.70, visits: 42, hours: [10, 11, 14, 15, 16, 17],    detail: 'https://www.google.com/' },
  { name: '翻译',            domain: 'translate.google.com', category: '工具', share: 0.30, visits: 12, hours: [11, 15, 17],                detail: 'https://translate.google.com/' },

  // 购物
  { name: '淘宝',            domain: 'taobao.com',            category: '购物', share: 0.60, visits: 4,  hours: [13, 22],                   detail: 'https://www.taobao.com/' },
  { name: '京东',            domain: 'jd.com',                category: '购物', share: 0.40, visits: 3,  hours: [13, 22],                   detail: 'https://www.jd.com/' },
];

// ─────────────────────────────────────────────
// Hourly helper — 把某网站的日总分钟分摊到它的活跃小时
// ─────────────────────────────────────────────

function genSiteHourly(site: SiteBase, totalMin: number, seed: number): Array<{ hour: number; minutes: number }> {
  const hours = site.hours;
  if (!hours.length || !totalMin) return [];
  // 按 0.5~1.5 加权随机分摊
  const weights = hours.map((h, i) => 0.5 + rand01(seed + h * 13 + i) * 1.0);
  const wSum = weights.reduce((a, b) => a + b, 0);
  return hours.map((h, i) => ({
    hour: h,
    minutes: Math.max(1, Math.round(totalMin * weights[i] / wSum)),
  }));
}

// ─────────────────────────────────────────────
// 按分类 + 日期生成网站级分布
// ─────────────────────────────────────────────

function buildSitesForDate(dateStr: string): any[] {
  const catMins = dailyCategoryMinutes(dateStr);
  const seed = dateSeed(dateStr);
  const out: any[] = [];

  // 按分类挑站点，按 share 分摊时长
  CATEGORIES.forEach(cat => {
    const sites = SITES_POOL.filter(s => s.category === cat.name);
    const catTotal = catMins[cat.name] || 0;
    if (!catTotal || !sites.length) return;

    // 按 share 分配
    const totalShare = sites.reduce((a, s) => a + s.share, 0);
    sites.forEach((site, i) => {
      const share   = site.share / totalShare;
      const minutes = Math.max(1, Math.round(catTotal * share * (0.85 + rand01(seed + i * 7) * 0.3)));
      if (minutes < 1) return;

      const visits  = Math.max(1, Math.round(site.visits * (0.7 + rand01(seed + i * 11) * 0.6)));
      const hourly  = genSiteHourly(site, minutes, seed);

      // 计算 startTime / endTime
      let startTime: string | null = null;
      let endTime:   string | null = null;
      if (site.category === '睡眠') {
        // 睡眠跨天：昨晚 23:xx 入睡，今早 7:xx 起床
        const prev = addDays(dateStr, -1);
        const sleepStart = 22 + Math.round(rand01(seed + 1) * 2);   // 22-23
        const sleepStartMin = Math.round(rand01(seed + 2) * 59);
        const sleepEnd = 6 + Math.round(rand01(seed + 3) * 2);      // 6-7
        const sleepEndMin = Math.round(rand01(seed + 4) * 59);
        startTime = isoNaive(prev, sleepStart, sleepStartMin);
        endTime   = isoNaive(dateStr, sleepEnd, sleepEndMin);
      } else if (hourly.length) {
        const minH = Math.min(...hourly.map(h => h.hour));
        const maxH = Math.max(...hourly.map(h => h.hour));
        startTime = isoNaive(dateStr, minH, Math.round(rand01(seed + 5 + i) * 50));
        // 结束时间=最后一小时起点+平均分钟
        const lastMin = hourly.find(h => h.hour === maxH)?.minutes || 10;
        endTime = isoNaive(dateStr, maxH, Math.min(59, lastMin));
      }

      out.push({
        name:      site.name,
        domain:    site.domain,
        category:  site.category,
        minutes,
        visits,
        hourly,
        startTime,
        endTime,
        detail:    site.detail || site.domain,
      });
    });
  });

  return out.sort((a, b) => b.minutes - a.minutes);
}

// ─────────────────────────────────────────────
// Hourly (时段热力图) — overview 用
// ─────────────────────────────────────────────

function buildHourlyForDate(dateStr: string): Record<number, Array<{ catName: string; minutes: number }>> {
  const sites = buildSitesForDate(dateStr);
  const out: Record<number, Record<string, number>> = {};
  sites.forEach(s => {
    (s.hourly || []).forEach((h: any) => {
      // 睡眠时段因为可能跨天，这里只保留当日小时
      if (!out[h.hour]) out[h.hour] = {};
      out[h.hour][s.category] = (out[h.hour][s.category] || 0) + h.minutes;
    });
  });
  const result: Record<number, Array<{ catName: string; minutes: number }>> = {};
  Object.keys(out).forEach(hStr => {
    const h = Number(hStr);
    result[h] = Object.entries(out[h])
      .map(([catName, minutes]) => ({ catName, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  });
  return result;
}

// ─────────────────────────────────────────────
// Mock API 实现
// ─────────────────────────────────────────────

/**
 * getTimeOverview mock
 * 对应 GET /api/time/overview/<openId>/?date=YYYY-MM-DD
 */
export function mockGetTimeOverview(_openId: string, date: string): Promise<any> {
  const catMins = dailyCategoryMinutes(date);
  const cats = CATEGORIES
    .map(c => ({ name: c.name, minutes: catMins[c.name] || 0 }))
    .filter(c => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  const total = cats.reduce((s, c) => s + c.minutes, 0);

  // 昨天
  const yMins = dailyCategoryMinutes(addDays(date, -1));
  const yTotal = Object.values(yMins).reduce((s, v) => s + v, 0);

  const hourly = buildHourlyForDate(date);

  const seed = dateSeed(date);
  const insights = [
    '工作时长 5 小时出头，专注度不错。注意下午 4 点后娱乐略多，给自己留点缓冲。',
    '今天睡眠充足（>7h），精神状态应该很好 👍 白天时间分配也挺均衡。',
    '娱乐类明显上涨，辛苦一周了适当放松也挺好。记得明天再把节奏拉回来～',
    '学习类时长稳定持续 1 小时以上，慢慢积累复利。',
    '购物时间比平时多，该收一下剁手的手 🛍️',
    '社交媒体占比偏高，可以留意一下使用上瘾的信号。',
  ];

  return delay({
    totalMinutes: total,
    siteCount:    16,
    pageCount:    140 + (seed % 60),
    avgMinutes:   Math.round(total / 16),
    diffMinutes:  total - yTotal,
    categories:   cats,
    hourly,
    insight:      insights[seed % insights.length],
  });
}

/**
 * getTimeWeekTrend mock
 * 对应 GET /api/time/week/<openId>/?date=YYYY-MM-DD
 *
 * 返回过去 7 天（含 pivot 当天，往前推 6 天），格式：
 *   [{ date, totalMinutes, categories: {catName: minutes} }, ...]
 */
export function mockGetTimeWeekTrend(_openId: string, date: string): Promise<any> {
  const today = todayStr();
  const days: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const ds = addDays(date, -i);
    const isFuture = ds > today;
    if (isFuture) {
      days.push({ date: ds, totalMinutes: 0, categories: {} });
      continue;
    }
    const catMins = dailyCategoryMinutes(ds);
    const total = Object.values(catMins).reduce((s, v) => s + v, 0);
    days.push({
      date: ds,
      totalMinutes: total,
      categories: catMins,
    });
  }
  return delay(days);
}

/**
 * getTimeSites mock
 * 对应 GET /api/time/sites/<openId>/?date=YYYY-MM-DD
 */
export function mockGetTimeSites(_openId: string, date: string): Promise<any> {
  const catMins = dailyCategoryMinutes(date);
  const cats = CATEGORIES
    .map(c => ({ name: c.name, minutes: catMins[c.name] || 0 }))
    .filter(c => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  const total = cats.reduce((s, c) => s + c.minutes, 0);
  const sites = buildSitesForDate(date);

  return delay({
    totalMinutes: total,
    categories:   cats,
    sites,
  });
}
