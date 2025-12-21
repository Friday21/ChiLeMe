import { getDashboardData } from '../../utils/service';

Page({
  data: {
    netWorth: '',
    netWorthChange: '',
    assetItems: [] as any[],
    monthlyBalance: '',
    monthlyIncome: '',
    monthlyExpense: '',
    monthlyStockProfit: '',
    incomePercent: 0,
    expensePercent: 0,
    trendOpts: {
      animation: true,
      color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
      padding: [15, 10, 0, 15],
      enableScroll: false,
      legend: {},
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        gridType: "dash",
        dashLength: 2
      },
      extra: {
        line: {
          type: "curve",
          width: 2,
          activeType: "hollow"
        }
      }
    },
    trendData: {},
  },
  onLoad() {
    // Dashboard initialization
  },
  onShow() {
    this.fetchData();
  },
  fetchData() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (!openId) {
      console.error('OpenID not found');
      return;
    }
    getDashboardData(openId).then(data => {
      const includeRealEstate = wx.getStorageSync('includeRealEstate') ?? true;
      
      const cash = parseFloat(data.cashAmount.replace(/,/g, ''));
      const stock = parseFloat(data.stockAmount.replace(/,/g, ''));
      const house = parseFloat((data.houseAmount || '5,320,000').replace(/,/g, ''));
      const mortgage = parseFloat(data.mortgageAmount.replace(/,/g, ''));
      
      let netWorthVal = cash + stock;
      if (includeRealEstate) {
        netWorthVal = netWorthVal + house - mortgage;
      }
      
      const finalNetWorth = netWorthVal;

      // Use asset items from API
      let assetItems = data.assetItems || [];

      if (!includeRealEstate) {
        assetItems = assetItems.map((item: any) => {
          if (item.name === '固定资产' || item.name === '负债') {
            return { ...item, notIncluded: true };
          }
          return item;
        });
      }

      // Calculate expense progress
      const monthlyIncomeVal = parseFloat(data.monthlyIncome.replace(/,/g, ''));
      const monthlyExpenseVal = parseFloat(data.monthlyExpense.replace(/,/g, ''));
      let expenseProgress = 0;
      if (monthlyIncomeVal > 0) {
        expenseProgress = (monthlyExpenseVal / monthlyIncomeVal) * 100;
      }

      this.setData({
        netWorthChange: data.netWorthChange,
        assetItems: assetItems,
        monthlyBalance: data.monthlyBalance,
        monthlyIncome: data.monthlyIncome,
        monthlyExpense: data.monthlyExpense,
        monthlyStockProfit: data.monthlyStockProfit,
        incomePercent: data.incomePercent,
        expensePercent: data.expensePercent,
        expenseProgress: expenseProgress,
        trendData: data.trendData
      });

      this.animateNum(finalNetWorth);
    });
  },
  toggleExpand(e: any) {
    const { id } = e.currentTarget.dataset;
    const assetItems = this.data.assetItems.map((item: any) => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded };
      }
      return item;
    });
    this.setData({ assetItems });
  },
  animateNum(finalVal: number) {
    const duration = 1000;
    const startTime = Date.now();
    const startVal = 0;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const currentVal = Math.floor(startVal + (finalVal - startVal) * ease);
      
      this.setData({
        netWorth: currentVal.toLocaleString()
      });

      if (progress < 1) {
        setTimeout(tick, 16);
      }
    };
    
    tick();
  }
})