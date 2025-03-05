import { getReport } from '../../utils/service';

const app = getApp<IAppOption>();


Component({
  data: {
    openId: "",
    weekchartData: {} as { categories: Array<{ value: number; color: string }>; series: Array<{ name: string; data: number }> },
    monthchartData: {} as { categories: Array<{ value: number; color: string }>; series: Array<{ name: string; data: number }> },
    yearchartData: {} as { categories: Array<{ value: number; color: string }>; series: Array<{ name: string; data: number }> },
    weekGoodDay: 2,
    monthGoodDay: 2,
    yearGoodDay: 2,
    weekopts: {
      title: {
        name: "",
        fontSize: 25,
        color: "#2fc25b",
        offsetY: 50,
        offsetX: 0
      },
      subtitle: {
        name: "",
        fontSize: 15,
        color: "#1890ff",
        offsetY: -50,
        offsetX: 0
      },
    },
    monthopts: {
      title: {
        name: "",
        fontSize: 25,
        color: "#2fc25b",
        offsetY: 50,
        offsetX: 0
      },
      subtitle: {
        name: "",
        fontSize: 15,
        color: "#1890ff",
        offsetY: -50,
        offsetX: 0
      },
    },

    yearopts: {
    }

  },
  lifetimes: {
    async attached() {
    this.setData({ 
        openId: app.globalData.openId || ''
        });
      await this.getServerData(app.globalData.openId);
    }
  },
  methods: {
    async getServerData(openId: string) {
      // 模拟从服务器获取数据时的延时
      const resp = await getReport(openId)
      const weekChartData = {
        categories: [
          { value: 0.2, color: "#A0A0A0" },
          { value: 0.8, color: "#2fc25b" },
          { value: 1, color: "#FFD580" }
        ],
        series: [
          {
            name: "不虚度指数",
            data: resp.weekData
          }
        ]
      };

      const monthChartData = {
        categories: [
          { value: 0.2, color: "#A0A0A0" },
          { value: 0.8, color: "#2fc25b" },
          { value: 1, color: "#FFD580" }
        ],
        series: [
          {
            name: "不虚度指数",
            data: resp.monthData
          }
        ]
      };

      const yeardata = {
        categories: ["1月","2月","3月","4月","5月","6月", "7月","8月","9月","10月","11月","12月"],
        series: [
          {
            name: "不虚度值",
            data: resp.yearData
          }
        ]
      };
      this.setData({
        weekchartData: weekChartData,
        monthchartData: monthChartData,
        yearchartData: yeardata,
        'weekopts.title.name': resp.weekpercentage,
        'monthopts.title.name': resp.monthpercentage,
        weekGoodDay: resp.weekGoodDay,
        monthGoodDay: resp.monthGoodDay,
        yearGoodDay: resp.yearGoodDay,
      });
    }
  }
});
