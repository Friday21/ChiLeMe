/**
 * 日期选择组件
 * Props: date (YYYY-MM-DD string, optional — defaults to today)
 * Events: dateChange({ date: 'YYYY-MM-DD' })
 */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildLabels(dateStr: string): { titleLabel: string; subLabel: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[dateObj.getDay()];
  const today = new Date();

  if (dateStr === todayStr()) {
    return { titleLabel: '今天', subLabel: `${m}月${d}日 · ${weekday}` };
  }
  if (dateStr === yesterdayStr()) {
    return { titleLabel: '昨天', subLabel: `${m}月${d}日 · ${weekday}` };
  }
  if (y === today.getFullYear()) {
    return { titleLabel: `${m}月${d}日`, subLabel: weekday };
  }
  return { titleLabel: `${y}年${m}月${d}日`, subLabel: weekday };
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
    titleLabel: '',
    subLabel: '',
    isToday: true,
    todayStr: '',
  },

  lifetimes: {
    attached() {
      const initial = this.properties.date || todayStr();
      this.setData({ todayStr: todayStr() });
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
      const { titleLabel, subLabel } = buildLabels(dateStr);
      this.setData({
        dateStr,
        titleLabel,
        subLabel,
        isToday: dateStr === today,
        todayStr: today,
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

    onGoToday() {
      const today = todayStr();
      if (this.data.dateStr === today) return;
      this._setDate(today);
      this.triggerEvent('dateChange', { date: today });
    },
  },
});
