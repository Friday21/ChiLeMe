/**
 * 日期选择组件
 * Props: date (YYYY-MM-DD string, optional — defaults to today)
 * Events: dateChange({ date: 'YYYY-MM-DD' })
 */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTHS   = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[dateObj.getDay()];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === todayStr()) return `${m}月${d}日 ${weekday}`;
  if (y === today.getFullYear() && m === (today.getMonth() + 1) && d === (today.getDate() - 1)) {
    return `${m}月${d}日 昨天`;
  }
  if (y === today.getFullYear()) return `${m}月${d}日 ${weekday}`;
  return `${y}年${m}月${d}日`;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

Component({
  properties: {
    date: {
      type: String,
      value: '',
    },
  },

  data: {
    dateStr: '',
    displayLabel: '',
    isToday: true,
  },

  lifetimes: {
    attached() {
      const initial = this.properties.date || todayStr();
      this._setDate(initial);
    },
  },

  observers: {
    date(val: string) {
      if (val) this._setDate(val);
    },
  },

  methods: {
    _setDate(dateStr: string) {
      const today = todayStr();
      this.setData({
        dateStr,
        displayLabel: formatLabel(dateStr),
        isToday: dateStr === today,
      });
    },

    onPrev() {
      const prev = addDays(this.data.dateStr, -1);
      this._setDate(prev);
      this.triggerEvent('dateChange', { date: prev });
    },

    onNext() {
      if (this.data.isToday) return;
      const next = addDays(this.data.dateStr, 1);
      // Don't go into the future
      if (next > todayStr()) return;
      this._setDate(next);
      this.triggerEvent('dateChange', { date: next });
    },

    onPickerChange(e: any) {
      const picked = e.detail.value as string;
      if (picked > todayStr()) return;
      this._setDate(picked);
      this.triggerEvent('dateChange', { date: picked });
    },
  },
});
