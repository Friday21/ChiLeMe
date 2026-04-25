import { getTimeWeekTrend } from '../../utils/service';
import { makeShareToFriend, makeShareToTimeline } from '../../utils/share';

// 四大分类：配色 + 图标
type CatCfg = { color: string; bgLight: string; icon: string; emoji: string };
const CAT_CONFIG: Record<string, CatCfg> = {
  '工作': { color: '#4B7BF5', bgLight: '#EBF0FF', icon: '/pages/assets/categories/work.svg',  emoji: '💼' },
  '学习': { color: '#22B8CF', bgLight: '#E3FAFC', icon: '/pages/assets/categories/study.svg', emoji: '📚' },
  '娱乐': { color: '#A78BFA', bgLight: '#F5F0FF', icon: '', emoji: '🤳' },
  '睡眠': { color: '#6366F1', bgLight: '#EEF2FF', icon: '/pages/assets/categories/sleep.svg', emoji: '😴' },
};
const FEATURED = ['工作', '学习', '娱乐', '睡眠'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function minutesToLabel(mins: number): string {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// y 轴：根据最大值挑个"漂亮"的刻度上限，并返回统一的格式化器
// 确保 5 条刻度（0/25/50/75/100%）要么全是 Xm 要么全是 Xh，不混用
function niceYAxis(actualMax: number): { yMax: number; format: (v: number) => string } {
  // 分钟尺度：上限 ≤ 60，统一 "Xm"
  if (actualMax <= 60) {
    let yMax = 60;
    if (actualMax <= 8)        yMax = 8;
    else if (actualMax <= 20)  yMax = 20;
    else if (actualMax <= 40)  yMax = 40;
    return {
      yMax,
      format: (v: number) => (v === 0 ? '0' : `${v}m`),
    };
  }
  // 小时尺度：yMax 必须是 240 的倍数（让 4 等分后每格都是整数小时）
  //   yMax=240 → 每格 1h → 0/1h/2h/3h/4h
  //   yMax=480 → 每格 2h → 0/2h/4h/6h/8h
  //   yMax=720 → 每格 3h → 0/3h/6h/9h/12h
  // 若实际最大值介于两档之间（比如 120m），也统一用 240m=4h 作底，
  // 省得出现 1.5h 这种碎刻度
  let yMax = 240;
  if (actualMax <= 240)       yMax = 240;   // 4h
  else if (actualMax <= 480)  yMax = 480;   // 8h
  else if (actualMax <= 720)  yMax = 720;   // 12h
  else if (actualMax <= 960)  yMax = 960;   // 16h
  else if (actualMax <= 1440) yMax = 1440;  // 24h
  else                        yMax = Math.ceil(actualMax / 240) * 240;

  return {
    yMax,
    format: (v: number) => {
      if (v === 0) return '0';
      return `${Math.round(v / 60)}h`;
    },
  };
}

function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return ['日', '一', '二', '三', '四', '五', '六'][wd];
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}`;
}

Page({
  data: {
    loading: true,
    hasData: false,
    summaries: [] as any[],
    xLabels: [] as string[],
    activeCat: null as string | null,
    rangeLabel: '',
    _raw: [] as any[],
  },

  onLoad() {
    this.fetchData();
  },

  onShow() {
    this.fetchData();
  },

  onPullDownRefresh() {
    this.fetchData();
  },

  fetchData() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) {
      this.setData({ loading: false, hasData: false });
      return;
    }

    this.setData({ loading: true });
    getTimeWeekTrend(openId, todayStr()).then((data: any[]) => {
      if (!data || !data.length) {
        this.setData({ loading: false, hasData: false });
        wx.stopPullDownRefresh();
        return;
      }

      const totalAll = data.reduce((sum, d) => sum + (d.totalMinutes || 0), 0);
      if (!totalAll) {
        this.setData({ loading: false, hasData: false, _raw: data });
        wx.stopPullDownRefresh();
        return;
      }

      const xLabels = data.map(d => weekdayLabel(d.date));
      const rangeLabel = `${shortDate(data[0].date)} – ${shortDate(data[data.length - 1].date)}`;

      const summaries = FEATURED.map(cat => {
        const series = data.map(d => Math.round((d.categories || {})[cat] || 0));
        const total  = series.reduce((a, b) => a + b, 0);
        const avg    = Math.round(total / 7);
        const max    = Math.max(...series);
        const last   = series[series.length - 1];
        const prev   = series[series.length - 2];
        const diff   = last - prev;
        const trend  = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        const cfg    = CAT_CONFIG[cat];
        return {
          key:        cat,
          color:      cfg.color,
          bgLight:    cfg.bgLight,
          icon:       cfg.icon,
          emoji:      cfg.emoji,
          totalLabel: minutesToLabel(total),
          avgLabel:   minutesToLabel(avg),
          maxLabel:   minutesToLabel(max),
          last,
          lastLabel:  minutesToLabel(last),
          diff,
          diffAbs:    minutesToLabel(Math.abs(diff)),
          trend,
          series,
        };
      });

      this.setData({
        loading: false,
        hasData: true,
        summaries,
        xLabels,
        rangeLabel,
        _raw: data,
      });

      setTimeout(() => this._drawChart(), 50);
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('[timeTrend] fetch error', err);
      this.setData({ loading: false, hasData: false });
      wx.stopPullDownRefresh();
    });
  },

  onLegendTap(e: any) {
    const key = e.currentTarget.dataset.key as string;
    const next = this.data.activeCat === key ? null : key;
    this.setData({ activeCat: next });
    this._drawChart();
  },

  _drawChart() {
    const { summaries, activeCat } = this.data;
    if (!summaries.length) return;

    wx.createSelectorQuery()
      .in(this as any)
      .select('#trendCanvas')
      .boundingClientRect((rect: any) => {
        if (!rect || !rect.width || !rect.height) return;
        this._renderCurves(rect.width, rect.height, summaries, activeCat);
      })
      .exec();
  },

  _renderCurves(w: number, h: number, summaries: any[], activeCat: string | null) {
    const ctx = wx.createCanvasContext('trendCanvas', this);
    ctx.clearRect(0, 0, w, h);

    const padL = 56, padR = 16, padT = 24, padB = 28;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const visible = activeCat ? summaries.filter(s => s.key === activeCat) : summaries;
    let actualMax = 0;
    visible.forEach(s => {
      s.series.forEach((v: number) => { if (v > actualMax) actualMax = v; });
    });
    const { yMax, format: fmtTick } = niceYAxis(actualMax || 60);

    // y 轴网格线 + 刻度
    ctx.setFontSize(20);
    ctx.setFillStyle('#bbb');
    ctx.setTextAlign('right');
    ctx.setTextBaseline('middle');
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const ratio = i / yTicks;
      const val   = Math.round(yMax * (1 - ratio));
      const y     = padT + plotH * ratio;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.setStrokeStyle(i === yTicks ? '#e5e7eb' : '#f1f3f7');
      ctx.setLineWidth(1);
      ctx.stroke();
      ctx.fillText(fmtTick(val), padL - 8, y);
    }

    // x 轴标签
    const n = 7;
    const stepX = plotW / (n - 1);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('top');
    const xLabels = this.data.xLabels;
    for (let i = 0; i < n; i++) {
      const x = padL + stepX * i;
      ctx.setFillStyle('#9ca3af');
      ctx.fillText(xLabels[i] || '', x, padT + plotH + 8);
    }

    // 画曲线（Fritsch-Carlson 单调三次插值，避免在谷/峰附近越界）
    visible.forEach((s: any) => {
      const pts: Array<[number, number]> = s.series.map((v: number, i: number) => {
        const x = padL + stepX * i;
        const y = padT + plotH * (1 - (v / yMax));
        return [x, y];
      });
      const n = pts.length;

      // 1) 相邻段斜率
      const dxs: number[] = [];
      const dys: number[] = [];
      const ms:  number[] = [];
      for (let i = 0; i < n - 1; i++) {
        const dx = pts[i + 1][0] - pts[i][0];
        const dy = pts[i + 1][1] - pts[i][1];
        dxs.push(dx);
        dys.push(dy);
        ms.push(dy / dx);
      }

      // 2) 各节点切线（相邻斜率异号时置 0，保证单调性）
      const ts: number[] = new Array(n);
      ts[0] = ms[0];
      ts[n - 1] = ms[n - 2];
      for (let i = 1; i < n - 1; i++) {
        ts[i] = (ms[i - 1] * ms[i] <= 0) ? 0 : (ms[i - 1] + ms[i]) / 2;
      }

      // 3) Fritsch-Carlson 修正，防止斜率超限造成的过冲
      for (let i = 0; i < n - 1; i++) {
        if (ms[i] === 0) {
          ts[i] = 0;
          ts[i + 1] = 0;
        } else {
          const a = ts[i] / ms[i];
          const b = ts[i + 1] / ms[i];
          const r2 = a * a + b * b;
          if (r2 > 9) {
            const tau = 3 / Math.sqrt(r2);
            ts[i]     = tau * a * ms[i];
            ts[i + 1] = tau * b * ms[i];
          }
        }
      }

      // 4) Hermite → Bezier
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < n - 1; i++) {
        const dx = dxs[i];
        const cp1x = pts[i][0] + dx / 3;
        const cp1y = pts[i][1] + ts[i] * dx / 3;
        const cp2x = pts[i + 1][0] - dx / 3;
        const cp2y = pts[i + 1][1] - ts[i + 1] * dx / 3;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1][0], pts[i + 1][1]);
      }
      ctx.setStrokeStyle(s.color);
      ctx.setLineWidth(3);
      ctx.setLineCap('round');
      ctx.setLineJoin('round');
      ctx.stroke();

      // 单一分类时显示填充
      if (activeCat) {
        ctx.lineTo(pts[pts.length - 1][0], padT + plotH);
        ctx.lineTo(pts[0][0], padT + plotH);
        ctx.closePath();
        ctx.setGlobalAlpha(0.15);
        ctx.setFillStyle(s.color);
        ctx.fill();
        ctx.setGlobalAlpha(1);
      }

      // 端点圆点
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.setFillStyle('#fff');
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.setStrokeStyle(s.color);
        ctx.setLineWidth(2);
        ctx.stroke();
      });
    });

    ctx.draw();
  },

  onShareAppMessage() {
    return makeShareToFriend({
      title: '近 7 天的时间趋势 · 一日虚度',
      path:  '/pages/timeSites/index',
    });
  },

  onShareTimeline() {
    return makeShareToTimeline({
      title: '一日虚度 · 7 天时间趋势',
    });
  },
});
