import { getTransactions, recordTransaction, deleteTransaction, getPlanningData } from '../../utils/service';

Page({
  data: {
    searchValue: '',
    transactions: [],
    showDate: false,
    currentDate: new Date().getTime(),
    minDate: new Date(2020, 0, 1).getTime(),
    maxDate: new Date().getTime(),
    currentMonth: '本月',
    showRecordForm: false,
    isEditMode: false,
    showRecordDate: false,
    showAccountPicker: false,
    accountColumns: [] as string[],
    currentRecordDate: new Date().getTime(),
    recordForm: {
      id: '',
      type: 'expense',
      amount: '',
      category: '',
      note: '',
      date: '',
      account: ''
    },
    openId: ''
  },
  onLoad() {
    const app = getApp<IAppOption>();
    const openId = app.globalData.openId || wx.getStorageSync('openId');
    if (openId) {
      this.setData({ openId });
      this.fetchTransactions();
      this.fetchAccounts();
    } else {
      console.error('OpenID not found');
    }

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.setData({
      currentMonth: `${date.getFullYear()}年${date.getMonth() + 1}月`,
      'recordForm.date': formattedDate
    });
  },
  fetchTransactions() {
    if (!this.data.openId) return;
    getTransactions(this.data.openId).then(data => {
      this.setData({ transactions: data });
    });
  },
  fetchAccounts() {
    if (!this.data.openId) return;
    getPlanningData(this.data.openId).then(data => {
      const cashAssets = data.assets.filter((a: any) => a.type === 'cash').map((a: any) => a.name);
      this.setData({ accountColumns: cashAssets });
    });
  },
  onSearch(e: any) {
    console.log('Search:', e.detail);
  },
  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.transactions.find((t: any) => t.id === id);
    if (item) {
      this.setData({
        showRecordForm: true,
        isEditMode: true,
        recordForm: {
          id: item.id,
          type: item.type,
          amount: item.amount.replace(/,/g, ''), // Remove commas for input
          category: item.category,
          note: item.note || '',
          date: item.date,
          account: item.account || ''
        }
      });
    }
  },
  
  showRecordForm() {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.setData({ 
      showRecordForm: true,
      isEditMode: false,
      recordForm: { id: '', type: 'expense', amount: '', category: '', note: '', date: formattedDate, account: '' }
    });
  },

  // Date Picker
  showDatePicker() {
    this.setData({ showDate: true });
  },
  onCloseDate() {
    this.setData({ showDate: false });
  },
  onConfirmDate(event: any) {
    const date = new Date(event.detail);
    const formattedMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    this.setData({
      currentDate: event.detail,
      currentMonth: formattedMonth,
      showDate: false
    });
    // Reload data based on date
    this.fetchTransactions();
  },

  // Record Form
  onCloseRecordForm() {
    this.setData({ showRecordForm: false });
  },
  onRecordTypeChange(event: any) {
    this.setData({ 'recordForm.type': event.detail });
  },
  onRecordAmountChange(event: any) {
    this.setData({ 'recordForm.amount': event.detail });
  },
  onRecordCategoryChange(event: any) {
    this.setData({ 'recordForm.category': event.detail });
  },
  onRecordNoteChange(event: any) {
    this.setData({ 'recordForm.note': event.detail });
  },
  
  openRecordDate() {
    this.setData({ showRecordDate: true, currentRecordDate: new Date(this.data.recordForm.date).getTime() });
  },
  closeRecordDate() {
    this.setData({ showRecordDate: false });
  },
  onConfirmRecordDate(event: any) {
    const date = new Date(event.detail);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.setData({
      'recordForm.date': formattedDate,
      showRecordDate: false
    });
  },
  
  openAccountPicker() {
    this.setData({ showAccountPicker: true });
  },
  closeAccountPicker() {
    this.setData({ showAccountPicker: false });
  },
  onConfirmAccount(event: any) {
    const { value } = event.detail;
    this.setData({
      'recordForm.account': value,
      showAccountPicker: false
    });
  },

  submitRecord() {
    const { type, amount, category, date, account } = this.data.recordForm;
    if (!amount || !date || !account) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '保存中' });
    if (!this.data.openId) return;
    recordTransaction(this.data.openId, this.data.recordForm).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ 
        showRecordForm: false,
        recordForm: { id: '', type: 'expense', amount: '', category: '', note: '', date: '', account: '' }
      });
      this.fetchTransactions();
    });
  },
  deleteRecord() {
    const { id } = this.data.recordForm;
    if (!id || !this.data.openId) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          deleteTransaction(this.data.openId, id).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ showRecordForm: false });
            this.fetchTransactions();
          });
        }
      }
    });
  }
})