import { getRecords, updateRecord, deleteRecord } from '../../utils/service';

const app = getApp<IAppOption>();

interface ComponentData {
  records: Array<{
    id: string;
    content: string;
    category: string;
    positive: number;
    date: string;
  }>;
  showDialog: boolean;
  currentRecord: {
    id: string;
    content: string;
    category: string;
    positive: number;
    date: string;
  } | null;
  editCategory: string;
  editPositive: number;
  loading: boolean;
  date: string;
  openId: string;
}

type ComponentMethods = Record<string, (...args: any[]) => any> & {
  fetchRecords(): Promise<void>;
  deleteRecord(e: WechatMiniprogram.TouchEvent): void;
  showEditDialog(e: WechatMiniprogram.TouchEvent): void;
  closeDialog(): void;
  handleEdit(): void;
  onRateChange(e: WechatMiniprogram.TouchEvent): void;
  formatDate(date: Date): string;
}

interface ComponentInstance {
  data: ComponentData;
  setData: WechatMiniprogram.Component.InstanceMethods<ComponentData>['setData'];
}

Component<ComponentData, {}, ComponentMethods>({
  properties: {
    showTodayOnly: {
      type: Boolean,
      value: false
    },
    date: {
      type: String,
      value: ''
    }
  },

  data: {
    records: [],
    showDialog: false,
    currentRecord: null,
    editCategory: '',
    editPositive: 3,
    openId: '',
    loading: false,
    date: ''
  },

  lifetimes: {
    attached(this: ComponentInstance) {
      this.setData({ 
        openId: app.globalData.openId || ''
      });
      if (this.properties.showTodayOnly) {
        this.setData({ date: this.formatDate(new Date()) });
      } else {
        this.setData({ date: this.properties.date || this.formatDate(new Date()) });
      }
      this.fetchRecords(this.data.date);
    }
  },

  methods: {
    async fetchRecords(this: ComponentInstance, date: string) {
      try {
        this.setData({ loading: true });
        
        // 检查 openId 是否存在
        if (!app.globalData.openId) {
          console.log('Waiting for openId...');
          // 等待一段时间后重试
          setTimeout(() => {
            if (app.globalData.openId) {
              this.fetchRecords();
            }
          }, 1000);
          return;
        }

        const records = await getRecords(app.globalData.openId, date);
        this.setData({ records });
        console.log('getRecords response:', records);
      } catch (err) {
        console.error('获取记录失败：', err);
        // 如果是 404 错误，可能是 openId 还未准备好，等待后重试
        if (err.statusCode === 404 && !app.globalData.openId) {
          setTimeout(() => {
            if (app.globalData.openId) {
              this.fetchRecords();
            }
          }, 1000);
        } else {
          wx.showToast({
            title: '获取记录失败',
            icon: 'none'
          });
        }
      } finally {
        this.setData({ loading: false });
      }
    },

    async deleteRecord(this: ComponentInstance, e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id;
      try {
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这条记录吗？',
          success: async (res) => {
            if (res.confirm) {
              await deleteRecord(this.data.openId, id);
              this.setData({
                records: this.data.records.filter(record => record.id !== id)
              });
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            }
          }
        });
      } catch (err) {
        console.error('删除失败：', err);
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    },

    showEditDialog(this: ComponentInstance, e: WechatMiniprogram.TouchEvent) {
      const record = e.currentTarget.dataset.record;
      this.setData({
        showDialog: true,
        currentRecord: record,
        editCategory: record.category,
        editPositive: record.positive
      });
    },

    closeDialog(this: ComponentInstance) {
      this.setData({
        showDialog: false,
        currentRecord: null,
        editCategory: '',
        editPositive: 3
      });
    },

    async handleEdit(this: ComponentInstance) {
      if (!this.data.currentRecord) return;
      
      try {
        const updatedRecord = {
          ...this.data.currentRecord,
          category: this.data.editCategory,
          positive: this.data.editPositive
        };
        
        await updateRecord(this.data.openId, this.data.currentRecord!.id, updatedRecord);
        
        const updatedRecords = this.data.records.map(record => {
          if (record.id === updatedRecord.id) {
            return updatedRecord;
          }
          return record;
        });

        this.setData({
          records: updatedRecords,
          showDialog: false,
          currentRecord: null
        });

        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } catch (err) {
        console.error('更新失败：', err);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    },

    onRateChange(this: ComponentInstance, e: WechatMiniprogram.TouchEvent) {
      const value = Number(e.detail);
      this.setData({
        editPositive: value
      });
    },

    // 格式化日期为 YYYY-MM-DD 格式
    formatDate(date: Date): string {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
}); 