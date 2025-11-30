// utils/api.ts
const callContainer = (path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data: any = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: {
        env: "prod-9g5b6d374032de85"
      },
      path: path,
      header: {
        "X-WX-SERVICE": "django-emmn",
        "content-type": "application/json"
      },
      method: method,
      data: data,
      success(res) {
        console.log('Container response:', res);
        if (!res.data || !res.data.data) {
          console.error('Invalid response format:', res);
          resolve([]);
        } else {
          resolve(res.data.data);
        }
      },
      fail(err) {
        console.error('Container call failed:', err);
        reject(err);
      }
    });
  });
};

// 上传语音文件并获取分析结果
interface VoiceAnalyzeResult {
  id: string;
  text: string;      // 识别出的文字
  positive: number;  // 情感分析结果
  category: string; // 内容分类
  date: string; // 日期
  createAt: string; // 创建时间
  comment: string; // comment
}

const analyzeVoice = async (filePath: string, openId: string): Promise<VoiceAnalyzeResult> => {
  try {
    // 生成云存储路径
    const cloudPath = `voices/${openId}/${new Date().getTime()}-${Math.floor(Math.random() * 1000)}.wav`;
    
    // 上传到云存储
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });

    if (!uploadResult.fileID) {
      throw new Error('上传失败');
    }

    // 调用后端服务进行语音分析
    const result = await callContainer(
      "api/usernotes/" + openId + "/",
      "POST",
      {
        fileId: uploadResult.fileID,
        user_openId: openId
      }
    );

    return result as VoiceAnalyzeResult;
  } catch (err) {
    console.error('语音分析失败：', err);
    throw err;
  }
};

const analyzeText = async (text: string, openId: string): Promise<VoiceAnalyzeResult> => {
  const result = await callContainer(
    "api/usernotes/" + openId + "/",
    "POST",
    {
      text: text,
      user_openId: openId
    }
  );
  return result as VoiceAnalyzeResult;
};

const getRecords = (openId: string, date: string): Promise<any> => {
  return callContainer("api/usernotes/" + openId + "/", "GET", { date: date });
};

const deleteRecord = (openId: string, recordId: string): Promise<any> => {
  return callContainer(
    "api/usernotes/" + openId + "/",
    "DELETE",
    { "id": recordId }
  );
};

const updateRecord = (openId: string, recordId: string, recordData: object): Promise<any> => {
  return callContainer(
    "api/usernotes/" + openId + "/",
    "PUT",
    {id: recordId, ...recordData}
  );
};

const addRecord = (openId: string, recordData: object): Promise<any> => {
  return callContainer(
    "api/usernotes/" + openId + "/",
    "POST",
    { ...recordData, user_openId: openId }
  );
};

const login = (body: object): Promise<any> => {
  return callContainer("api/login/", "POST", body);
};

const createUser = (body: object): Promise<any> => {
  return callContainer("api/users/", "POST", body);
};

const likeDinner = (body: object): Promise<any> => {
  return callContainer("api/dinnersLikes/", "POST", body);
};

const clearLikeDinner = (body: object): Promise<any> => {
  return callContainer("api/dinnersLikes/", "DELETE", body);
};

const addFriend = (friendData: object): Promise<any> => {
  return callContainer("api/friends/" + friendData["user_openId"] + "/", "POST", friendData);
};

const removeFriend = (friendData: object): Promise<any> => {
  return callContainer("api/friends/" + friendData["user_openId"] + "/", "DELETE", friendData);
};

const getFriend = (openId: string): Promise<any> => {
  return callContainer("api/friends/" + openId + "/", "GET");
};

const getHistory = (openId: string): Promise<any> => {
  return callContainer("api/usernoteshistory/" + openId + "/", "GET");
};

const getReport = (openId: string): Promise<any> => {
  return callContainer("api/usernotesreport/" + openId + "/", "GET");
};


export {  
  login, 
  createUser, 
  likeDinner, 
  addFriend, 
  removeFriend, 
  getFriend, 
  clearLikeDinner, 
  analyzeVoice,
  analyzeText,
  getRecords,
  deleteRecord,
  updateRecord,
  addRecord,
  getHistory,
  getReport,
  getDashboardData,
  getTransactions,
  getPlanningData,
  getProfileData,
  getAssetCorrectionData,
  saveAssetCorrection,
  recordTransaction,
  deleteTransaction,
  updatePlanningData,
  manageAsset,
  manageFixedItem,
  manageLoan,
  manageFutureItem
};

// --- Mock Data APIs for Financial Features ---
// Note: These functions are currently mocks. 
// Backend developers should implement the corresponding API endpoints and update these functions to use callContainer.

const recordTransaction = (data: any): Promise<any> => {
  // Backend API: POST /api/transactions/
  // If data.id exists, it's an update (PUT /api/transactions/:id/)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Recorded transaction:', data);
      resolve({ success: true, ...data });
    }, 500);
  });
};

const deleteTransaction = (id: string): Promise<any> => {
  // Backend API: DELETE /api/transactions/:id/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Deleted transaction:', id);
      resolve({ success: true });
    }, 500);
  });
};

const updatePlanningData = (type: string, data: any): Promise<any> => {
  // Backend API: POST/PUT /api/planning/:type/
  // Used for future items or generic planning updates
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Updated ${type} planning data:`, data);
      resolve({ success: true });
    }, 500);
  });
};

const manageAsset = (action: 'add'|'update'|'delete', data: any): Promise<any> => {
  // Backend API: 
  // add -> POST /api/assets/
  // update -> PUT /api/assets/:id/
  // delete -> DELETE /api/assets/:id/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Asset ${action}:`, data);
      resolve({ success: true });
    }, 500);
  });
};

const manageFixedItem = (action: 'add'|'update'|'delete', data: any): Promise<any> => {
  // Backend API: 
  // add -> POST /api/fixed-items/
  // update -> PUT /api/fixed-items/:id/
  // delete -> DELETE /api/fixed-items/:id/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fixed Item ${action}:`, data);
      resolve({ success: true });
    }, 500);
  });
};

const manageLoan = (action: 'add'|'update'|'delete', data: any): Promise<any> => {
  // Backend API: 
  // add -> POST /api/loans/
  // update -> PUT /api/loans/:id/
  // delete -> DELETE /api/loans/:id/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Loan ${action}:`, data);
      resolve({ success: true });
    }, 500);
  });
};

const manageFutureItem = (action: 'add'|'update'|'delete', data: any): Promise<any> => {
  // Backend API: 
  // add -> POST /api/future-items/
  // update -> PUT /api/future-items/:id/
  // delete -> DELETE /api/future-items/:id/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Future Item ${action}:`, data);
      resolve({ success: true });
    }, 500);
  });
};

const getDashboardData = (): Promise<any> => {
  // Backend API: GET /api/dashboard/summary/
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        netWorth: '1,234,567',
        netWorthChange: '8,230',
        cashAmount: '52,300',
        stockAmount: '198,500',
        mortgageAmount: '1,698,000',
        monthlyBalance: '5,001',
        monthlyIncome: '20,000',
        monthlyExpense: '14,999',
        monthlyStockProfit: '+2,300',
        incomePercent: 70,
        expensePercent: 30,
        savingsProgress: 64,
        trendData: {
          categories: ["12月", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月"],
          series: [
            { name: "预测净资产", data: [123, 125, 128, 130, 133, 135, 138, 140, 143, 145, 148, 150] }
          ]
        },
        ringData: {
          series: [
            { name: "现金", data: 50 },
            { name: "股票", data: 30 },
            { name: "房贷", data: 20 }
          ]
        }
      });
    }, 500);
  });
};

const getTransactions = (filter?: any): Promise<any> => {
  // Backend API: GET /api/transactions/
  // Support query params: ?month=2025-11&type=income
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, type: 'income', category: '工资', amount: '20,000', date: '2025-11-10', account: '招行', icon: '💰', note: '11月工资' },
        { id: 2, type: 'expense', category: '房贷还款', amount: '10,929', date: '2025-11-05', account: '工行', icon: '🏠', note: '' },
        { id: 3, type: 'expense', category: '买电视', amount: '2,999', date: '2025-11-01', account: '信用卡', icon: '📺', note: 'Sony 55寸', isLarge: true },
        { id: 4, type: 'income', category: '股票分红', amount: '500', date: '2025-11-15', account: '证券账户', icon: '📈', note: '' }
      ]);
    }, 500);
  });
};

const getPlanningData = (): Promise<any> => {
  // Backend API: GET /api/planning/summary/
  // Should return aggregated data for Assets, Fixed Items, Future Steps, Loans
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        assets: [
          { id: 1, name: '招商银行', type: 'cash', value: '20,000', desc: '尾号 8888' },
          { id: 2, name: '腾讯股票', type: 'stock', value: '198,500', desc: '港股账户' },
          { id: 3, name: '自住房', type: 'house', value: '3,500,000', desc: '估值' }
        ],
        fixed: [
          { id: 1, type: 'income', name: '工资', amount: '20,000', date: '每月 10 日', account: '招行工资卡', enabled: true },
          { id: 2, type: 'expense', name: '房贷', amount: '10,929', date: '每月 5 日', account: '工行按揭', enabled: true }
        ],
        futureSteps: [
          {
            type: 'cash',
            text: '年终奖 +20,000',
            desc: '2025-12-25 · 预计入账',
            inactiveIcon: 'circle',
            activeIcon: 'checked'
          },
          {
            type: 'stock',
            text: 'RSU 10 股归属',
            desc: '2026-01-15 · 约 +8,000',
            inactiveIcon: 'circle',
            activeIcon: 'checked'
          },
          {
            type: 'cash',
            text: '季度奖金',
            desc: '2026-03-31 · 待定',
            inactiveIcon: 'circle',
            activeIcon: 'checked'
          }
        ],
        loans: [
          { 
            id: 1, 
            name: '公积金贷款', 
            principal: '600,000', 
            periods: 240, 
            rate: '3.1', 
            method: 'equal_principal_interest', 
            repaymentDate: '每月 20 日' 
          },
          { 
            id: 2, 
            name: '商业贷款', 
            principal: '1,098,000', 
            periods: 240, 
            rate: '4.2', 
            method: 'equal_principal', 
            repaymentDate: '每月 20 日' 
          }
        ]
      });
    }, 500);
  });
};

const getProfileData = (): Promise<any> => {
  // Backend API: GET /api/profile/
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        userInfo: {
          name: 'FridayLi',
          days: 128,
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        accounts: [
          { name: '招商银行', value: '¥20,000', label: '尾号 8888' },
          { name: '工商银行', value: '¥32,300', label: '尾号 1234' },
          { name: '股票账户', value: '¥198,500' }
        ],
        settings: {
          currency: '人民币 (CNY)',
          startDate: '2025-07-01'
        }
      });
    }, 500);
  });
};

const getAssetCorrectionData = (): Promise<any> => {
  // Backend API: GET /api/assets/correction/
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        cashSystem: 50000,
        stockSystem: 200000
      });
    }, 500);
  });
};

const saveAssetCorrection = (data: any): Promise<any> => {
  // Backend API: POST /api/assets/correction/
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Saved correction:', data);
      resolve({ success: true });
    }, 500);
  });
};