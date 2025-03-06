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
  getHistory,
  getReport
};