// utils/service.ts

import {
  mockGetTimeOverview,
  mockGetTimeWeekTrend,
  mockGetTimeSites,
} from './mockData';

/**
 * ⚠️ 本地调试开关
 * 改为 true → 所有时间追踪接口使用 Mock 数据，无需连接服务器
 * 上线前改回 false
 */
const USE_MOCK = true;

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
  manageFutureItem,
  getTimeOverview,
  getTimeWeekTrend,
  getTimeSites,
};

// ─────────────────────────────────────────────────────────────────────────────
// Time Tracker APIs
// 数据由定时任务分析浏览器历史后上传，小程序拉取展示
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 时间总览
 * GET /api/time/overview/<openId>/?date=YYYY-MM-DD
 * Returns:
 *   totalMinutes, siteCount, pageCount, avgMinutes,
 *   diffMinutes (vs yesterday),
 *   categories: [{name, minutes}],
 *   hourly: {hour: [{catName, minutes}]},
 *   insight: string
 */
const getTimeOverview = (openId: string, date: string): Promise<any> => {
  if (USE_MOCK) return mockGetTimeOverview(openId, date);
  return callContainer(`/api/time/overview/${openId}/`, 'GET', { date });
};

/**
 * 本周趋势
 * GET /api/time/week/<openId>/?date=YYYY-MM-DD
 * Returns: [{date, totalMinutes}] (本周一到本周日，7条)
 */
const getTimeWeekTrend = (openId: string, date: string): Promise<any> => {
  if (USE_MOCK) return mockGetTimeWeekTrend(openId, date);
  return callContainer(`/api/time/week/${openId}/`, 'GET', { date });
};

/**
 * 网站明细
 * GET /api/time/sites/<openId>/?date=YYYY-MM-DD
 * Returns:
 *   totalMinutes,
 *   categories: [{name, minutes}],
 *   sites: [{name, domain, category, minutes, visits, hourly:[{hour,minutes}]}]
 */
const getTimeSites = (openId: string, date: string): Promise<any> => {
  if (USE_MOCK) return mockGetTimeSites(openId, date);
  return callContainer(`/api/time/sites/${openId}/`, 'GET', { date });
};

// --- Financial Features APIs ---
// Note: These functions now use real API calls via callContainer.

/**
 * Dashboard API
 * GET /api/dashboard/summary/:openId/
 * Returns: Dashboard overview with net worth, assets breakdown, monthly summary, and chart data
 */
const getDashboardData = (openId: string): Promise<any> => {
  return callContainer(`/api/dashboard/summary/${openId}/`, 'GET');
};

/**
 * Transactions API - List
 * GET /api/transactions/:openId/
 * Query params: ?month=2025-11&type=income&category=工资
 * Returns: Array of transaction records
 */
const getTransactions = (openId: string, filter?: any): Promise<any> => {
  return callContainer(`/api/transactions/${openId}/`, 'GET', filter);
};

/**
 * Transactions API - Create/Update
 * POST /api/transactions/:openId/ (create)
 * PUT /api/transactions/:openId/:id/ (update)
 * Body: { id (for update), type, category, amount, date, account, note, icon }
 * Returns: Created/updated transaction record
 */
const recordTransaction = (openId: string, data: any): Promise<any> => {
  if (data.id) {
    return callContainer(`/api/transactions/${openId}/${data.id}/`, 'PUT', data);
  } else {
    return callContainer(`/api/transactions/${openId}/`, 'POST', data);
  }
};

/**
 * Transactions API - Delete
 * DELETE /api/transactions/:openId/:id/
 * Body: { id }
 * Returns: Success status
 */
const deleteTransaction = (openId: string, id: string): Promise<any> => {
  return callContainer(`/api/transactions/${openId}/${id}/`, 'DELETE');
};

/**
 * Planning API - Get All Planning Data
 * GET /api/planning/summary/:openId/
 * Returns: Aggregated data for Assets, Fixed Items, Future Income, Loans
 */
const getPlanningData = (openId: string): Promise<any> => {
  return callContainer(`/api/planning/summary/${openId}/`, 'GET');
};

/**
 * Assets API - Manage (Create/Update/Delete)
 * POST /api/assets/:openId/ (create)
 * PUT /api/assets/:openId/:id/ (update)
 * DELETE /api/assets/:openId/:id/ (delete)
 * Body: { id (for update/delete), name, type, value, desc, stock_code?, shares? }
 * Returns: Success status and updated record
 */
const manageAsset = (openId: string, action: 'add'|'update'|'delete', data: any): Promise<any> => {
  if (action === 'add') {
    return callContainer(`/api/assets/${openId}/`, 'POST', data);
  } else if (action === 'update') {
    return callContainer(`/api/assets/${openId}/${data.id}/`, 'PUT', data);
  } else if (action === 'delete') {
    return callContainer(`/api/assets/${openId}/${data.id}/`, 'DELETE');
  }
  return Promise.reject('Invalid action');
};

/**
 * Fixed Items API - Manage (Create/Update/Delete)
 * POST /api/fixed-items/:openId/ (create)
 * PUT /api/fixed-items/:openId/:id/ (update)
 * DELETE /api/fixed-items/:openId/:id/ (delete)
 * Body: { id (for update/delete), name, type, amount, frequency, date_value, date, account, enabled }
 * Returns: Success status and updated record
 */
const manageFixedItem = (openId: string, action: 'add'|'update'|'delete', data: any): Promise<any> => {
  if (action === 'add') {
    return callContainer(`/api/fixed-items/${openId}/`, 'POST', data);
  } else if (action === 'update') {
    return callContainer(`/api/fixed-items/${openId}/${data.id}/`, 'PUT', data);
  } else if (action === 'delete') {
    return callContainer(`/api/fixed-items/${openId}/${data.id}/`, 'DELETE');
  }
  return Promise.reject('Invalid action');
};

/**
 * Future Items API - Manage (Create/Update/Delete)
 * POST /api/future-items/:openId/ (create)
 * PUT /api/future-items/:openId/:id/ (update)
 * DELETE /api/future-items/:openId/:id/ (delete)
 * Body: { id (for update/delete), type, name, amount?, stock_code?, shares?, desc }
 * Returns: Success status and updated record
 */
const manageFutureItem = (openId: string, action: 'add'|'update'|'delete', data: any): Promise<any> => {
  if (action === 'add') {
    return callContainer(`/api/future-items/${openId}/`, 'POST', data);
  } else if (action === 'update') {
    return callContainer(`/api/future-items/${openId}/${data.id}/`, 'PUT', data);
  } else if (action === 'delete') {
    return callContainer(`/api/future-items/${openId}/${data.id}/`, 'DELETE');
  }
  return Promise.reject('Invalid action');
};

/**
 * Loans API - Manage (Create/Update/Delete)
 * POST /api/loans/:openId/ (create)
 * PUT /api/loans/:openId/:id/ (update)
 * DELETE /api/loans/:openId/:id/ (delete)
 * Body: { id (for update/delete), name, principal, periods, rate, method, repayment_date }
 * Returns: Success status and updated record
 */
const manageLoan = (openId: string, action: 'add'|'update'|'delete', data: any): Promise<any> => {
  if (action === 'add') {
    return callContainer(`/api/loans/${openId}/`, 'POST', data);
  } else if (action === 'update') {
    return callContainer(`/api/loans/${openId}/${data.id}/`, 'PUT', data);
  } else if (action === 'delete') {
    return callContainer(`/api/loans/${openId}/${data.id}/`, 'DELETE');
  }
  return Promise.reject('Invalid action');
};

/**
 * Planning Data API - Generic Update (Legacy)
 * POST /api/planning/:openId/:type/
 * Body: Planning data for specific type
 * Returns: Success status
 */
const updatePlanningData = (openId: string, type: string, data: any): Promise<any> => {
  return callContainer(`/api/planning/${openId}/${type}/`, 'POST', data);
};

/**
 * Profile API - Get User Profile
 * GET /api/profile/:openId/
 * Returns: User info, accounts list, and settings
 */
const getProfileData = (openId: string): Promise<any> => {
  return callContainer(`/api/profile/${openId}/`, 'GET');
};

/**
 * Asset Correction API - Get Current Values
 * GET /api/assets/correction/:openId/
 * Returns: System calculated values for cash and stocks
 */
const getAssetCorrectionData = (openId: string): Promise<any> => {
  return callContainer(`/api/assets/correction/${openId}/`, 'GET');
};

/**
 * Asset Correction API - Save Corrected Values
 * POST /api/assets/correction/:openId/
 * Body: { cashActual, stockActual, note }
 * Returns: Success status
 */
const saveAssetCorrection = (openId: string, data: any): Promise<any> => {
  return callContainer(`/api/assets/correction/${openId}/`, 'POST', data);
};