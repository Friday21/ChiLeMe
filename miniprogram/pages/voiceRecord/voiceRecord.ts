import { analyzeVoice } from '../../utils/service';
import Toast from '@vant/weapp/toast/toast';

const app = getApp<IAppOption>();

interface ComponentData {
  isRecording: boolean;
  isAnalyzing: boolean;
  records: Array<{
    id: string;
    content: string;
    category: string;
    positive: number;
    date: string;
  }>;
  recorderManager: WechatMiniprogram.RecorderManager | null;
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
}

type ComponentMethods = Record<string, (...args: any[]) => any> & {
  startRecord(): void;
  stopRecord(): void;
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
    isRecording: false,
    isAnalyzing: false,
    records: [],
    recorderManager: null,
    showDialog: false,
    currentRecord: null,
    editCategory: '',
    editPositive: 3
  },

  lifetimes: {
    attached(this: ComponentInstance) {
      // 初始化录音管理器
      const recorderManager = wx.getRecorderManager();
      
      // 监听开始事件
      recorderManager.onStart(() => {
        console.log("开始录音");
        this.setData({ isRecording: true });
      });

      // 监听错误事件
      recorderManager.onError((res) => {
        console.error("录音错误", res.errMsg);
        wx.showToast({
          title: '录音失败',
          icon: 'none'
        });
        this.setData({ isRecording: false, isAnalyzing: false });
      });

      // 监听结束事件
      recorderManager.onStop(async (res) => {
        console.log("录音文件路径", res.tempFilePath);
        this.setData({ isRecording: false, isAnalyzing: true });
        
        try {
          // 调用语音分析服务
          const result = await analyzeVoice(res.tempFilePath, app.globalData.openId || '');
          if (result.text == "未识别语音") {
            Toast.fail(result.text);
            return;
          }

          // 添加新记录
          const newRecord = {
            id: result.id,
            content: result.text,
            category: Array.isArray(result.category) ? result.category[0] : result.category,
            positive: typeof result.positive === 'string' ? 3 : Number(result.positive),
            date: new Date().toLocaleString()
          };

          this.setData({
            records: [newRecord, ...this.data.records]
          });
          
          // 刷新recordList组件
          const recordListComponent = this.selectComponent('#recordList');
          if (recordListComponent) {
            const formattedDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
            recordListComponent.fetchRecords(formattedDate);
          }

        } catch (err) {
          console.error('处理失败：', err);
          wx.showToast({
            title: '处理失败',
            icon: 'none'
          });
        } finally {
          this.setData({ isAnalyzing: false });
        }
      });

      this.setData({ recorderManager });
    },

    detached(this: ComponentInstance) {
      // 组件销毁时，确保录音停止
      if (this.data.isRecording && this.data.recorderManager) {
        this.data.recorderManager.stop();
      }
    }
  },

  methods: {
    startRecord(this: ComponentInstance) {
      if (this.data.recorderManager && !this.data.isRecording) {
        // 开始录音
        this.data.recorderManager.start({
          duration: 30000,     // 最长录音时间，单位 ms
          sampleRate: 16000,   // 采样率 16kHz
          numberOfChannels: 1,  // 单声道
          encodeBitRate: 48000, // 编码率设为允许范围内的值
          format: 'wav',       // WAV 格式
          audioSource: 'auto'  // 自动选择音频输入源
        });
      }
    },

    stopRecord(this: ComponentInstance) {
      if (this.data.recorderManager) {
        this.data.recorderManager.stop();
      }
    },

    deleteRecord(this: ComponentInstance, e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: (res) => {
          if (res.confirm) {
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

    handleEdit(this: ComponentInstance) {
      if (!this.data.currentRecord) return;
      
      const updatedRecords = this.data.records.map(record => {
        if (record.id === this.data.currentRecord!.id) {
          return {
            ...record,
            category: this.data.editCategory,
            positive: this.data.editPositive
          };
        }
        return record;
      });

      this.setData({
        records: updatedRecords,
        showDialog: false,
        currentRecord: null
      });
    },

    onRateChange(this: ComponentInstance, e: WechatMiniprogram.TouchEvent) {
      const value = Number(e.detail);
      this.setData({
        editPositive: value
      });
    }
  }
});
