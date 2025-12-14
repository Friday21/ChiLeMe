import { getAssetCorrectionData, saveAssetCorrection } from '../../utils/service';

Page({
  data: {
    cashSystem: 0,
    cashReal: '',
    cashDiff: 0,
    stockSystem: 0,
    stockReal: '',
    stockDiff: 0,
    openId: ''
  },
  onLoad() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (openId) {
      this.setData({ openId });
      this.fetchData();
    } else {
      console.error('OpenID not found');
    }
  },
  fetchData() {
    if (!this.data.openId) return;
    getAssetCorrectionData(this.data.openId).then(data => {
      this.setData({
        cashSystem: data.cashSystem,
        stockSystem: data.stockSystem
      });
    });
  },
  onCashChange(e: any) {
    const val = parseFloat(e.detail);
    this.setData({
      cashReal: e.detail,
      cashDiff: val - this.data.cashSystem
    });
  },
  onStockChange(e: any) {
    const val = parseFloat(e.detail);
    this.setData({
      stockReal: e.detail,
      stockDiff: val - this.data.stockSystem
    });
  },
  saveCorrection() {
    if (!this.data.openId) return;
    const data = {
      cashReal: this.data.cashReal,
      stockReal: this.data.stockReal
    };
    saveAssetCorrection(this.data.openId, data).then(() => {
      wx.showToast({ title: '校正成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  }
})