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
}

type ComponentMethods = Record<string, (...args: any[]) => any> & {
  fetchRecords(): Promise<void>;
  deleteRecord(e: WechatMiniprogram.TouchEvent): void;
  showEditDialog(e: WechatMiniprogram.TouchEvent): void;
  closeDialog(): void;
  handleEdit(): void;
  onRateChange(e: WechatMiniprogram.TouchEvent): void;
}

interface ComponentInstance {
  data: ComponentData;
  setData: WechatMiniprogram.Component.InstanceMethods<ComponentData>['setData'];
}

Component<ComponentData, {}, ComponentMethods>({
  data: {
    records: [],
    showDialog: false,
    currentRecord: null,
    editCategory: '',
    editPositive: 3,
    openId: '',
    loading: false
  },

  lifetimes: {
    attached(this: ComponentInstance) {
      this.setData({ openId: app.globalData.openId || '' });
      this.fetchRecords();
    }
  },

  methods: {
    async fetchRecords(this: ComponentInstance) {
      try {
        this.setData({ loading: true });
        const records = await getRecords(app.globalData.openId || '');
        console.log("records");
        console.log(records);
        this.setData({ records });
      } catch (err) {
        console.error('获取记录失败：', err);
        wx.showToast({
          title: '获取记录失败',
          icon: 'none'
        });
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
    }
  }
}); 