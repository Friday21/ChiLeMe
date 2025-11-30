import { getDashboardData } from '../../utils/service';

Page({
  data: {
    todayDate: '',
    netWorth: '',
    netWorthChange: '',
    cashAmount: '',
    stockAmount: '',
    mortgageAmount: '',
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
    ringOpts: {
      animation: true,
      legend: { show: false },
      dataLabel: false,
      title: {
        name: "70%",
        fontSize: 15,
        color: "#1890ff"
      },
      subtitle: {
        name: "净资产",
        fontSize: 10,
        color: "#666666"
      },
      extra: {
        ring: {
          ringWidth: 15,
          activeOpacity: 0.5,
          activeRadius: 10,
          offsetAngle: 0,
          labelWidth: 15,
          border: false,
          borderWidth: 3,
          borderColor: "#FFFFFF"
        }
      }
    },
    ringData: {},
  },
  onLoad() {
    const date = new Date();
    const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
    this.setData({
      todayDate: formattedDate
    });
  },
  onShow() {
    this.fetchData();
  },
  fetchData() {
    getDashboardData().then(data => {
      const finalNetWorth = parseFloat(data.netWorth.replace(/,/g, ''));

      this.setData({
        netWorthChange: data.netWorthChange,
        cashAmount: data.cashAmount,
        stockAmount: data.stockAmount,
        mortgageAmount: data.mortgageAmount,
        monthlyBalance: data.monthlyBalance,
        monthlyIncome: data.monthlyIncome,
        monthlyExpense: data.monthlyExpense,
        monthlyStockProfit: data.monthlyStockProfit,
        incomePercent: data.incomePercent,
        expensePercent: data.expensePercent,
        trendData: data.trendData,
        ringData: data.ringData
      });

      this.animateNum(finalNetWorth);
    });
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