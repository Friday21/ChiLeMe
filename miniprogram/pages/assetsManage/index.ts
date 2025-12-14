import { getPlanningData, updatePlanningData, manageAsset, manageFixedItem, manageLoan, manageFutureItem } from '../../utils/service';

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
    isEditMode: false,
    showFrequencyPicker: false,
    showDatePicker: false,
    showAccountPicker: false,
    showCalendar: false,
    frequencyColumns: ['每周', '每月', '每年'],
    dateColumns: [] as any[],
    accountColumns: [] as string[],
    currentPickerKey: '',
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
    getPlanningData(this.data.openId).then(data => {
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
        { key: 'stock_code', label: '股票代码', value: item.stock_code || '', placeholder: '例如：00700' },
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
        { 
          key: 'type', 
          label: '类型', 
          value: 'expense', 
          inputType: 'radio', 
          options: [
            { label: '收入', value: 'income' },
            { label: '支出', value: 'expense' }
          ]
        },
        { key: 'amount', label: '金额', value: '', placeholder: '请输入金额' },
        { key: 'date_value', label: '每月几号', value: '', placeholder: '1-28', inputType: 'number' },
        { key: 'account', label: '账户', value: '', placeholder: '请选择账户', inputType: 'account-picker' }
      ],
      tempEditData: { type: 'expense', frequency: 'monthly' }
    });
  },
  editFixedItem(e: any) {
    const item = e.currentTarget.dataset.item;
    
    // Use date_value directly
    let dateVal = item.date_value;
    
    this.setData({
      showEditPopup: true,
      editTitle: '编辑固定收支',
      currentEditType: 'fixed',
      isEditMode: true,
      editFields: [
        { key: 'name', label: '名称', value: item.name, placeholder: '例如：工资' },
        { 
          key: 'type', 
          label: '类型', 
          value: item.type, 
          inputType: 'radio', 
          options: [
            { label: '收入', value: 'income' },
            { label: '支出', value: 'expense' }
          ]
        },
        { key: 'amount', label: '金额', value: item.amount, placeholder: '请输入金额' },
        { key: 'date_value', label: '每月几号', value: dateVal, placeholder: '1-28', inputType: 'number' },
        { key: 'account', label: '账户', value: item.account, placeholder: '请选择账户', inputType: 'account-picker' }
      ],
      tempEditData: { ...item, frequency: 'monthly', date_value: dateVal }
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
        { key: 'amount', label: '金额', value: '', placeholder: '请输入金额' },
        { key: 'name', label: '标题', value: '', placeholder: '例如：年终奖' },
        { key: 'date', label: '日期', value: '', placeholder: '请选择日期', inputType: 'calendar' },
        { key: 'desc', label: '描述', value: '', placeholder: '例如：2025-12-25 · 预计入账' }
      ],
      tempEditData: { type: 'cash' }
    });
  },
  editFutureItem(e: any) {
    const item = e.currentTarget.dataset.item;
    const isStock = item.type === 'stock';
    
    const fields = [
      { 
        key: 'type', 
        label: '类型', 
        value: item.type || 'cash', 
        inputType: 'radio', 
        options: [
          { label: '现金', value: 'cash' },
          { label: '股票', value: 'stock' }
        ]
      }
    ];

    if (isStock) {
      fields.push(
        { key: 'stock_code', label: '股票代码', value: item.stock_code || '', placeholder: '例如：00700' },
        { key: 'shares', label: '股票份数', value: item.shares || '', placeholder: '例如：100' },
        { key: 'name', label: '标题', value: item.name, placeholder: '例如：年终奖' }
      );
    } else {
      fields.push(
        { key: 'amount', label: '金额', value: item.amount, placeholder: '请输入金额' },
        { key: 'name', label: '标题', value: item.name, placeholder: '例如：年终奖' }
      );
    }
    fields.push(
      { key: 'date', label: '日期', value: item.date || '', placeholder: '请选择日期', inputType: 'calendar' },
      { key: 'desc', label: '描述', value: item.desc, placeholder: '例如：2025-12-25 · 预计入账' }
    );

    this.setData({
      showEditPopup: true,
      editTitle: '编辑未来收入',
      currentEditType: 'future',
      isEditMode: true,
      editFields: fields,
      tempEditData: { ...item }
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
        { 
          key: 'method', 
          label: '还款方式', 
          value: 'equal_principal_interest', 
          inputType: 'picker',
          options: ['等额本息', '等额本金'],
          range: ['equal_principal_interest', 'equal_principal']
        },
        { key: 'repayment_date', label: '每月还款日', value: '', placeholder: '1-28', inputType: 'number' }
      ],
      tempEditData: { method: 'equal_principal_interest' }
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
        { 
          key: 'method', 
          label: '还款方式', 
          value: item.method, 
          inputType: 'picker',
          options: ['等额本息', '等额本金'],
          range: ['equal_principal_interest', 'equal_principal']
        },
        { key: 'repayment_date', label: '每月还款日', value: item.repayment_date, placeholder: '1-28', inputType: 'number' }
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

    // Handle frequency change for fixed items
    if (key === 'frequency' && this.data.currentEditType === 'fixed') {
      // Update the date field based on new frequency
      const editFields = this.data.editFields.map(field => {
        if (field.key === 'date_value') {
          return { ...field, frequency: value, value: '' };
        }
        return field;
      });
      this.setData({ editFields });
      this.data.tempEditData.date_value = '';
    }

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
            { key: 'stock_code', label: '股票代码', value: this.data.tempEditData.stock_code || '', placeholder: '例如：00700' },
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
          }
        ];

        if (isStock) {
          fields.push(
            { key: 'stock_code', label: '股票代码', value: this.data.tempEditData.stock_code || '', placeholder: '例如：00700' },
            { key: 'shares', label: '股票份数', value: this.data.tempEditData.shares || '', placeholder: '例如：100' },
            { key: 'name', label: '标题', value: this.data.tempEditData.name || '', placeholder: '例如：年终奖' }
          );
        } else {
          fields.push(
            { key: 'amount', label: '金额', value: this.data.tempEditData.amount || '', placeholder: '请输入金额' },
            { key: 'name', label: '标题', value: this.data.tempEditData.name || '', placeholder: '例如：年终奖' }
          );
        }
        fields.push(
          { key: 'date', label: '日期', value: this.data.tempEditData.date || '', placeholder: '请选择日期', inputType: 'calendar' },
          { key: 'desc', label: '描述', value: this.data.tempEditData.desc || '', placeholder: '例如：2025-12-25 · 预计入账' }
        );
        this.setData({ editFields: fields });
      }
    }
  },
  submitEdit() {
    const { currentEditType, tempEditData, isEditMode } = this.data;
    
    // Validation for Fixed Income/Expense
    if (currentEditType === 'fixed') {
      if (!tempEditData.name || !tempEditData.amount || !tempEditData.date_value || !tempEditData.account) {
        wx.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }

      // Validate date range 1-28 and convert to int
      const dateVal = parseInt(tempEditData.date_value);
      if (isNaN(dateVal) || dateVal < 1 || dateVal > 28) {
        wx.showToast({ title: '日期必须是 1-28', icon: 'none' });
        return;
      }
      tempEditData.date_value = dateVal;
      delete tempEditData.date;
    }

    // Validation for Future Income
    if (currentEditType === 'future') {
      if (tempEditData.amount) {
        tempEditData.amount = parseInt(tempEditData.amount);
      }
    }

    // Validation for Loan
    if (currentEditType === 'loan') {
      if (!tempEditData.name || !tempEditData.principal || !tempEditData.periods || !tempEditData.rate || !tempEditData.method || !tempEditData.repayment_date) {
        wx.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }
      // Ensure repayment_date is an integer
      const repaymentDateVal = parseInt(tempEditData.repayment_date);
      if (isNaN(repaymentDateVal) || repaymentDateVal < 1 || repaymentDateVal > 28) {
        wx.showToast({ title: '还款日必须是 1-28', icon: 'none' });
        return;
      }
      tempEditData.repayment_date = repaymentDateVal;
    }

    wx.showLoading({ title: '保存中' });
    
    if (!this.data.openId) return;

    let promise;
    if (currentEditType === 'asset') {
      promise = manageAsset(this.data.openId, isEditMode ? 'update' : 'add', tempEditData);
    } else if (currentEditType === 'fixed') {
      promise = manageFixedItem(this.data.openId, isEditMode ? 'update' : 'add', tempEditData);
    } else if (currentEditType === 'loan') {
      promise = manageLoan(this.data.openId, isEditMode ? 'update' : 'add', tempEditData);
    } else if (currentEditType === 'future') {
      promise = manageFutureItem(this.data.openId, isEditMode ? 'update' : 'add', tempEditData);
    } else {
      promise = updatePlanningData(this.data.openId, currentEditType, tempEditData);
    }

    promise.then(res => {
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ showEditPopup: false });
      this.fetchData(); // Reload data
    });
  },
  formatFixedItemDate(frequency: string, dateValue: string): string {
    if (frequency === 'weekly') {
      return `每周周${dateValue}`;
    } else if (frequency === 'monthly') {
      return `每月 ${dateValue} 日`;
    } else if (frequency === 'yearly') {
      const parts = dateValue.split('-');
      return `每年 ${parts[0]}月${parts[1]}日`;
    }
    return dateValue;
  },
  onFrequencyPickerShow(e: any) {
    this.setData({ showFrequencyPicker: true });
  },
  onFrequencyPickerConfirm(e: any) {
    const { value, index } = e.detail;
    const frequencyValues = ['weekly', 'monthly', 'yearly'];
    this.data.tempEditData.frequency = frequencyValues[index];
    
    // Update editFields
    const editFields = this.data.editFields.map(field => {
      if (field.key === 'frequency') {
        return { ...field, value: frequencyValues[index] };
      }
      if (field.key === 'date_value') {
        return { ...field, frequency: frequencyValues[index], value: '' };
      }
      // Sync other fields from tempEditData
      if (this.data.tempEditData[field.key] !== undefined) {
        return { ...field, value: this.data.tempEditData[field.key] };
      }
      return field;
    });
    
    this.setData({ 
      showFrequencyPicker: false,
      editFields,
      tempEditData: { ...this.data.tempEditData, date_value: '' }
    });
  },
  onFrequencyPickerCancel() {
    this.setData({ showFrequencyPicker: false });
  },
  onDatePickerShow(e: any) {
    const frequency = e.currentTarget.dataset.frequency || 'monthly';
    let columns = [];
    
    if (frequency === 'weekly') {
      columns = ['一', '二', '三', '四', '五', '六', '日'];
    } else if (frequency === 'monthly') {
      columns = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    } else if (frequency === 'yearly') {
      // For yearly, we'll use a simple text input instead
      this.setData({ showDatePicker: false });
      return;
    }
    
    this.setData({ 
      showDatePicker: true,
      dateColumns: columns
    });
  },
  onDatePickerConfirm(e: any) {
    const { value, index } = e.detail;
    const frequency = this.data.tempEditData.frequency || 'monthly';
    
    this.data.tempEditData.date_value = value;
    
    const editFields = this.data.editFields.map(field => {
      if (field.key === 'date_value') {
        return { ...field, value: value };
      }
      // Sync other fields from tempEditData
      if (this.data.tempEditData[field.key] !== undefined) {
        return { ...field, value: this.data.tempEditData[field.key] };
      }
      return field;
    });
    
    this.setData({ 
      showDatePicker: false,
      editFields
    });
  },
  onDatePickerCancel() {
    this.setData({ showDatePicker: false });
  },
  onAccountPickerShow() {
    const cashAssets = this.data.assets.filter((a: any) => a.type === 'cash').map((a: any) => a.name);
    this.setData({ 
      showAccountPicker: true,
      accountColumns: cashAssets
    });
  },
  onAccountPickerConfirm(e: any) {
    const { value } = e.detail;
    this.data.tempEditData.account = value;
    
    const editFields = this.data.editFields.map(field => {
      if (field.key === 'account') {
        return { ...field, value: value };
      }
      // Sync other fields from tempEditData
      if (this.data.tempEditData[field.key] !== undefined) {
        return { ...field, value: this.data.tempEditData[field.key] };
      }
      return field;
    });
    
    this.setData({ 
      showAccountPicker: false,
      editFields
    });
  },
  onAccountPickerCancel() {
    this.setData({ showAccountPicker: false });
  },
  
  // Generic Picker for other fields (like Loan Method)
  onPickerShow(e: any) {
    const key = e.currentTarget.dataset.key;
    const field = this.data.editFields.find(f => f.key === key);
    if (field && field.options) {
      this.setData({
        showFrequencyPicker: true, // Reuse frequency picker popup for simplicity or create a new generic one
        frequencyColumns: field.options,
        currentPickerKey: key
      });
    }
  },
  onPickerConfirm(e: any) {
    const { value, index } = e.detail;
    const key = this.data.currentPickerKey;
    
    if (key === 'method') {
       const field = this.data.editFields.find(f => f.key === key);
       const realValue = field.range[index];
       this.data.tempEditData[key] = realValue;
       
       const editFields = this.data.editFields.map(f => {
         if (f.key === key) {
           return { ...f, value: realValue };
         }
         // Sync other fields from tempEditData
         if (this.data.tempEditData[f.key] !== undefined) {
           return { ...f, value: this.data.tempEditData[f.key] };
         }
         return f;
       });
       this.setData({ editFields });
    } else {
       // Fallback for frequency if still used
       this.onFrequencyPickerConfirm(e);
       return;
    }
    
    this.setData({ showFrequencyPicker: false });
  },
  onCalendarShow() {
    this.setData({ showCalendar: true });
  },
  onCalendarClose() {
    this.setData({ showCalendar: false });
  },
  onCalendarConfirm(e: any) {
    const date = e.detail;
    // Format date to YYYY-MM-DD
    const dateStr = this.formatDate(date);
    
    this.data.tempEditData.date = dateStr;
    
    const editFields = this.data.editFields.map(field => {
      if (field.key === 'date') {
        return { ...field, value: dateStr };
      }
      // Sync other fields from tempEditData
      if (this.data.tempEditData[field.key] !== undefined) {
        return { ...field, value: this.data.tempEditData[field.key] };
      }
      return field;
    });
    
    this.setData({ 
      showCalendar: false,
      editFields
    });
  },
  formatDate(date: Date) {
    date = new Date(date);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  },
  deleteItem() {
    const { currentEditType, tempEditData } = this.data;
    if (!this.data.openId) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这项记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          let promise;
          if (currentEditType === 'asset') {
            promise = manageAsset(this.data.openId, 'delete', tempEditData);
          } else if (currentEditType === 'fixed') {
            promise = manageFixedItem(this.data.openId, 'delete', tempEditData);
          } else if (currentEditType === 'loan') {
            promise = manageLoan(this.data.openId, 'delete', tempEditData);
          } else if (currentEditType === 'future') {
            promise = manageFutureItem(this.data.openId, 'delete', tempEditData);
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