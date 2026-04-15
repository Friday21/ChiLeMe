/**
 * mockData.ts — 时间追踪功能的本地 Mock 数据
 *
 * 使用方式：在 service.ts 顶部把 USE_MOCK 改为 true 即可。
 * 所有函数签名与真实 API 保持一致，直接替换调用。
 */

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

/** 取最近 N 天的日期字符串数组，最后一个是今天 */
function recentDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(fmtDate(d));
  }
  return dates;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return fmtDate(new Date());
}

/** 模拟网络延迟（50–200ms） */
function delay<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), 80 + Math.random() * 120));
}

// ─────────────────────────────────────────────
// 核心 Mock 数据
// ─────────────────────────────────────────────

const CATEGORIES = [
  { name: '工作/学习', baseMinutes: 141 },
  { name: '社交媒体',  baseMinutes: 80  },
  { name: '资讯/新闻', baseMinutes: 53  },
  { name: '视频/娱乐', baseMinutes: 37  },
  { name: '购物',      baseMinutes: 23  },
];

const SITES_POOL = [
  { name: 'Claude',        domain: 'claude.ai',         category: '工作/学习', baseMin: 68, visits: 34 },
  { name: 'GitHub',        domain: 'github.com',         category: '工作/学习', baseMin: 56, visits: 21 },
  { name: 'Google',        domain: 'google.com',         category: '工作/学习', baseMin: 17, visits: 47 },
  { name: 'Stack Overflow',domain: 'stackoverflow.com',  category: '工作/学习', baseMin: 14, visits: 8  },
  { name: '微博',           domain: 'weibo.com',          category: '社交媒体',  baseMin: 44, visits: 12 },
  { name: 'X (Twitter)',   domain: 'x.com',              category: '社交媒体',  baseMin: 18, visits: 9  },
  { name: 'Reddit',        domain: 'reddit.com',         category: '社交媒体',  baseMin: 18, visits: 6  },
  { name: 'YouTube',       domain: 'youtube.com',        category: '视频/娱乐', baseMin: 37, visits: 8  },
  { name: '少数派',         domain: 'sspai.com',          category: '资讯/新闻', baseMin: 30, visits: 5  },
  { name: 'Hacker News',   domain: 'news.ycombinator.com',category: '资讯/新闻', baseMin: 23, visits: 11 },
  { name: '淘宝',           domain: 'taobao.com',         category: '购物',      baseMin: 15, visits: 4  },
  { name: '京东',           domain: 'jd.com',             category: '购物',      baseMin: 8,  visits: 3  },
  { name: 'V2EX',          domain: 'v2ex.com',           category: '资讯/新闻', baseMin: 14, visits: 7  },
  { name: 'Product Hunt',  domain: 'producthunt.com',    category: '工作/学习', baseMin: 11, visits: 4  },
  { name: '知乎',           domain: 'zhihu.com',          category: '资讯/新闻', baseMin: 10, visits: 6  },
  { name: 'bilibili',      domain: 'bilibili.com',       category: '视频/娱乐', baseMin: 9,  visits: 3  },
];

/** 生成带随机扰动的分钟数（±20%） */
function jitter(base: number, seed: number = 1): number {
  const r = ((seed * 2654435761) >>> 0) % 100 / 100;  // deterministic for same seed
  return Math.max(1, Math.round(base * (0.8 + r * 0.4)));
}

/** 根据日期生成一个稳定的 seed */
function dateSeed(dateStr: string): number {
  return dateStr.split('-').reduce((acc, s) => acc + parseInt(s, 10), 0);
}

// ─────────────────────────────────────────────
// Mock API 实现
// ─────────────────────────────────────────────

/**
 * getTimeOverview mock
 * 对应 GET /api/time/overview/<openId>/?date=YYYY-MM-DD
 */
export function mockGetTimeOverview(_openId: string, date: string): Promise<any> {
  const seed = dateSeed(date);
  const cats = CATEGORIES.map(c => ({
    name: c.name,
    minutes: jitter(c.baseMinutes, seed + c.baseMinutes),
  }));
  const total = cats.reduce((s, c) => s + c.minutes, 0);
  const yesterdaySeed = seed - 15;  // slightly different
  const yesterdayTotal = CATEGORIES.reduce((s, c) => s + jitter(c.baseMinutes, yesterdaySeed + c.baseMinutes), 0);

  // Hourly breakdown (map categories to hours)
  const hourly: Record<number, Array<{ catName: string; minutes: number }>> = {};
  const hourSlots = [
    [9, '工作/学习', 22], [10, '工作/学习', 35], [10, '资讯/新闻', 12],
    [11, '工作/学习', 28], [12, '社交媒体', 18], [12, '资讯/新闻', 8],
    [13, '购物', 15], [14, '工作/学习', 40], [15, '工作/学习', 25],
    [15, '社交媒体', 18], [16, '社交媒体', 22], [16, '资讯/新闻', 14],
    [17, '视频/娱乐', 20], [18, '视频/娱乐', 17], [19, '社交媒体', 20],
    [20, '资讯/新闻', 19], [21, '工作/学习', 18], [21, '视频/娱乐', 10],
    [22, '社交媒体', 15],
  ] as [number, string, number][];

  hourSlots.forEach(([h, cat, mins]) => {
    if (!hourly[h]) hourly[h] = [];
    hourly[h].push({ catName: cat, minutes: jitter(mins, seed + h) });
  });

  const insights = [
    '工作相关浏览占比最高，但下午3点后社交媒体激增，注意力分散明显。',
    '今天专注度不错！工作/学习时间超过2小时，继续保持。',
    '购物时间比平时少，省了不少钱 🎉 工作时间也很充实。',
    '视频娱乐偏多，要注意休息和工作的平衡哦。',
    '资讯阅读占比较高，记得筛选高质量内容，避免信息过载。',
  ];

  return delay({
    totalMinutes: total,
    siteCount: 16,
    pageCount: 143 + (seed % 50),
    avgMinutes: Math.round(total / 16),
    diffMinutes: total - yesterdayTotal,
    categories: cats,
    hourly,
    insight: insights[seed % insights.length],
  });
}

/**
 * getTimeWeekTrend mock
 * 对应 GET /api/time/week/<openId>/?date=YYYY-MM-DD
 */
export function mockGetTimeWeekTrend(_openId: string, date: string): Promise<any> {
  // Return the 7 days ending on the given date's week (Mon–Sun)
  const [y, m, d] = date.split('-').map(Number);
  const pivot = new Date(y, m - 1, d);
  // Find Monday of this week
  const dow = pivot.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(pivot);
  monday.setDate(pivot.getDate() + mondayOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const ds = fmtDate(day);
    const seed = dateSeed(ds);
    const isFuture = ds > todayStr();
    const totalMinutes = isFuture ? 0 : CATEGORIES.reduce((s, c) => s + jitter(c.baseMinutes, seed + c.baseMinutes), 0);
    return { date: ds, totalMinutes: isFuture ? 0 : totalMinutes };
  });

  return delay(days);
}

/**
 * getTimeSites mock
 * 对应 GET /api/time/sites/<openId>/?date=YYYY-MM-DD
 */
export function mockGetTimeSites(_openId: string, date: string): Promise<any> {
  const seed = dateSeed(date);
  const cats = CATEGORIES.map(c => ({
    name: c.name,
    minutes: jitter(c.baseMinutes, seed + c.baseMinutes),
  }));
  const total = cats.reduce((s, c) => s + c.minutes, 0);

  const sites = SITES_POOL.map(site => {
    const mins = jitter(site.baseMin, seed + site.baseMin);
    const visits = Math.max(1, Math.round(site.visits * (0.7 + (seed % 5) * 0.1)));

    // Generate hourly data for this site
    const hourly = [10, 11, 14, 15, 16, 19, 20, 21]
      .filter((_, i) => (seed + i) % 3 !== 0)  // randomly skip some hours
      .map(h => ({
        hour: h,
        minutes: Math.max(1, Math.round(mins * (0.05 + (((h * seed) % 100) / 100) * 0.25))),
      }));

    return {
      name: site.name,
      domain: site.domain,
      category: site.category,
      minutes: mins,
      visits,
      hourly,
    };
  });

  return delay({ totalMinutes: total, categories: cats, sites });
}
