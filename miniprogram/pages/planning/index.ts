import { getPlanningData, updatePlanningData, manageAsset, manageFixedItem, manageLoan } from '../../utils/service';

Page({
  data: {
    activeTab: 0,
    activeStep: 0,
    assets: [],
    fixed: [],
    steps: [],
    loans: [],
    showEditPopup: false,
    editTitle: '',
    editFields: [],
    currentEditType: '',
    tempEditData: {},
    isEditMode: false
  },
  onLoad() {
    this.fetchData();
  },
  fetchData() {
    getPlanningData().then(data => {
      this.setData({
        assets: data.assets,
        fixed: data.fixed,
        steps: data.futureSteps,
        loans: data.loans
      });
    });
  },
  onChangeTab(event: any) {
    this.setData({ activeTab: event.detail.name });
  },

  onAddClick() {
    const { activeTab } = this.data;
    if (activeTab === 0) {
      this.addAsset();
    } else if (activeTab === 1) {
      this.addFixedItem();
    } else if (activeTab === 2) {
      this.addFutureItem();
    } else if (activeTab === 3) {
      this.addLoan();
    }
  },
  
  // Asset Handlers
  addAsset() {
    this.setData({
      showEditPopup: true,
      editTitle: '添加资产',
      currentEditType: 'asset',
      isEditMode: false,
      editFields: [
        { 
          key: 'type', 
          label: '类型', 
          value: 'cash', 
          inputType: 'radio', 
          options: [
            { label: '现金', value: 'cash' },
            { label: '股票', value: 'stock' },
            { label: '房产', value: 'house' }
          ]
        },
        { key: 'name', label: '名称', value: '', placeholder: '例如：招商银行' },
        { key: 'value', label: '金额', value: '', placeholder: '请输入金额' },
        { key: 'desc', label: '描述', value: '', placeholder: '例如：尾号 8888' }
      ],
      tempEditData: { type: 'cash' }
    });
  },
  editAsset(e: any) {
    const item = e.currentTarget.dataset.item;
    const isStock = item.type === 'stock';
    
    const fields = [
      { 
        key: 'type', 
        label: '类型', 
        value: item.type, 
        inputType: 'radio', 
        options: [
          { label: '现金', value: 'cash' },
          { label: '股票', value: 'stock' },
          { label: '房产', value: 'house' }
        ]
      },
      { key: 'name', label: '名称', value: item.name, placeholder: '例如：招商银行' }
    ];

    if (isStock) {
      fields.push(
        { key: 'stockCode', label: '股票代码', value: item.stockCode || '', placeholder: '例如：00700' },
        { key: 'shares', label: '持仓份额', value: item.shares || '', placeholder: '例如：100' }
      );
    } else {
      fields.push(
        { key: 'value', label: '金额', value: item.value, placeholder: '请输入金额' }
      );
    }

    fields.push({ key: 'desc', label: '描述', value: item.desc, placeholder: '例如：尾号 8888' });

    this.setData({
      showEditPopup: true,
      editTitle: '编辑资产',
      currentEditType: 'asset',
      isEditMode: true,
      editFields: fields,
      tempEditData: { ...item }
    });
  },

  // Fixed Item Handlers
  addFixedItem() {
    this.setData({
      showEditPopup: true,
      editTitle: '添加固定收支',
      currentEditType: 'fixed',
      isEditMode: false,
      editFields: [
        { key: 'name', label: '名称', value: '', placeholder: '例如：工资' },
        { key: 'type', label: '类型', value: 'income', placeholder: 'income/expense' },
        { key: 'amount', label: '金额', value: '', placeholder: '请输入金额' },
        { key: 'date', label: '日期', value: '', placeholder: '例如：每月 10 日' },
        { key: 'account', label: '账户', value: '', placeholder: '请输入账户' }
      ],
      tempEditData: {}
    });
  },
  editFixedItem(e: any) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showEditPopup: true,
      editTitle: '编辑固定收支',
      currentEditType: 'fixed',
      isEditMode: true,
      editFields: [
        { key: 'name', label: '名称', value: item.name, placeholder: '例如：工资' },
        { key: 'type', label: '类型', value: item.type, placeholder: 'income/expense' },
        { key: 'amount', label: '金额', value: item.amount, placeholder: '请输入金额' },
        { key: 'date', label: '日期', value: item.date, placeholder: '例如：每月 10 日' },
        { key: 'account', label: '账户', value: item.account, placeholder: '请输入账户' }
      ],
      tempEditData: { ...item }
    });
  },

  addFutureItem() {
    this.setData({
      showEditPopup: true,
      editTitle: '添加未来收入',
      currentEditType: 'future',
      isEditMode: false,
      editFields: [
        { 
          key: 'type', 
          label: '类型', 
          value: 'cash', 
          inputType: 'radio', 
          options: [
            { label: '现金', value: 'cash' },
            { label: '股票', value: 'stock' }
          ]
        },
        { key: 'text', label: '标题', value: '', placeholder: '例如：年终奖' },
        { key: 'amount', label: '金额', value: '', placeholder: '请输入金额' },
        { key: 'desc', label: '描述', value: '', placeholder: '例如：2025-12-25 · 预计入账' }
      ],
      tempEditData: { type: 'cash' }
    });
  },

  // Loan Handlers
  addLoan() {
    this.setData({
      showEditPopup: true,
      editTitle: '添加贷款',
      currentEditType: 'loan',
      isEditMode: false,
      editFields: [
        { key: 'name', label: '名称', value: '', placeholder: '例如：公积金贷款' },
        { key: 'principal', label: '剩余本金', value: '', placeholder: '请输入金额' },
        { key: 'periods', label: '剩余期数', value: '', placeholder: '请输入期数' },
        { key: 'rate', label: '年利率(%)', value: '', placeholder: '例如：3.25' },
        { key: 'method', label: '还款方式', value: 'equal_principal_interest', placeholder: 'equal_principal_interest / equal_principal' },
        { key: 'repaymentDate', label: '还款日', value: '', placeholder: '例如：每月 20 日' }
      ],
      tempEditData: {}
    });
  },
  editLoan(e: any) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showEditPopup: true,
      editTitle: '编辑贷款',
      currentEditType: 'loan',
      isEditMode: true,
      editFields: [
        { key: 'name', label: '名称', value: item.name, placeholder: '例如：公积金贷款' },
        { key: 'principal', label: '剩余本金', value: item.principal, placeholder: '请输入金额' },
        { key: 'periods', label: '剩余期数', value: item.periods, placeholder: '请输入期数' },
        { key: 'rate', label: '年利率(%)', value: item.rate, placeholder: '例如：3.25' },
        { key: 'method', label: '还款方式', value: item.method, placeholder: 'equal_principal_interest / equal_principal' },
        { key: 'repaymentDate', label: '还款日', value: item.repaymentDate, placeholder: '例如：每月 20 日' }
      ],
      tempEditData: { ...item }
    });
  },
  
  onCloseEditPopup() {
    this.setData({ showEditPopup: false });
  },
  onEditFieldChange(event: any) {
    const key = event.currentTarget.dataset.key;
    const value = event.detail;
    this.data.tempEditData[key] = value;

    // Dynamic field update for Asset and Future Income
    if (key === 'type') {
      const { currentEditType } = this.data;
      if (currentEditType === 'asset') {
        const isStock = value === 'stock';
        const fields = [
          { 
            key: 'type', 
            label: '类型', 
            value: value, 
            inputType: 'radio', 
            options: [
              { label: '现金', value: 'cash' },
              { label: '股票', value: 'stock' },
              { label: '房产', value: 'house' }
            ]
          },
          { key: 'name', label: '名称', value: this.data.tempEditData.name || '', placeholder: '例如：招商银行' }
        ];

        if (isStock) {
          fields.push(
            { key: 'stockCode', label: '股票代码', value: this.data.tempEditData.stockCode || '', placeholder: '例如：00700' },
            { key: 'shares', label: '持仓份额', value: this.data.tempEditData.shares || '', placeholder: '例如：100' }
          );
        } else {
          fields.push(
            { key: 'value', label: '金额', value: this.data.tempEditData.value || '', placeholder: '请输入金额' }
          );
        }
        fields.push({ key: 'desc', label: '描述', value: this.data.tempEditData.desc || '', placeholder: '例如：尾号 8888' });
        this.setData({ editFields: fields });
      } else if (currentEditType === 'future') {
        const isStock = value === 'stock';
        const fields = [
          { 
            key: 'type', 
            label: '类型', 
            value: value, 
            inputType: 'radio', 
            options: [
              { label: '现金', value: 'cash' },
              { label: '股票', value: 'stock' }
            ]
          },
          { key: 'text', label: '标题', value: this.data.tempEditData.text || '', placeholder: '例如：年终奖' }
        ];

        if (isStock) {
          fields.push(
            { key: 'stockCode', label: '股票代码', value: this.data.tempEditData.stockCode || '', placeholder: '例如：00700' },
            { key: 'shares', label: '股票份数', value: this.data.tempEditData.shares || '', placeholder: '例如：100' }
          );
        } else {
          fields.push(
            { key: 'amount', label: '金额', value: this.data.tempEditData.amount || '', placeholder: '请输入金额' }
          );
        }
        fields.push({ key: 'desc', label: '描述', value: this.data.tempEditData.desc || '', placeholder: '例如：2025-12-25 · 预计入账' });
        this.setData({ editFields: fields });
      }
    }
  },
  submitEdit() {
    wx.showLoading({ title: '保存中' });
    const { currentEditType, tempEditData, isEditMode } = this.data;
    
    let promise;
    if (currentEditType === 'asset') {
      promise = manageAsset(isEditMode ? 'update' : 'add', tempEditData);
    } else if (currentEditType === 'fixed') {
      promise = manageFixedItem(isEditMode ? 'update' : 'add', tempEditData);
    } else if (currentEditType === 'loan') {
      promise = manageLoan(isEditMode ? 'update' : 'add', tempEditData);
    } else {
      promise = updatePlanningData(currentEditType, tempEditData);
    }

    promise.then(res => {
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ showEditPopup: false });
      this.fetchData(); // Reload data
    });
  },
  deleteItem() {
    const { currentEditType, tempEditData } = this.data;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这项记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          let promise;
          if (currentEditType === 'asset') {
            promise = manageAsset('delete', tempEditData);
          } else if (currentEditType === 'fixed') {
            promise = manageFixedItem('delete', tempEditData);
          } else if (currentEditType === 'loan') {
            promise = manageLoan('delete', tempEditData);
          } else {
            // Future items or others if needed
            promise = Promise.resolve();
          }

          promise.then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ showEditPopup: false });
            this.fetchData();
          });
        }
      }
    });
  },
  noop() {}
})