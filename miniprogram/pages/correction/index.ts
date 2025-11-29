import { getAssetCorrectionData, saveAssetCorrection } from '../../utils/service';

Page({
  data: {
    cashSystem: 0,
    cashReal: '',
    cashDiff: 0,
    stockSystem: 0,
    stockReal: '',
    stockDiff: 0
  },
  onLoad() {
    this.fetchData();
  },
  fetchData() {
    getAssetCorrectionData().then(data => {
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
    const data = {
      cashReal: this.data.cashReal,
      stockReal: this.data.stockReal
    };
    saveAssetCorrection(data).then(() => {
      wx.showToast({ title: '校正成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  }
})