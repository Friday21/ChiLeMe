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
        resolve(res.data.data);
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

const getDinners = (openId: string): Promise<any> => {
  return callContainer("api/dinners/" + openId + "/", "GET");
};

const getFriendDinners = (openId: string): Promise<any> => {
  return callContainer("api/friend/dinners/" + openId + "/", "GET");
};

const uploadDinner = (dinnerData: object): Promise<any> => {
  return callContainer("api/dinners/" + dinnerData["user_openId"] + "/", "POST", dinnerData);
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

export { getDinners, uploadDinner, login, createUser, getFriendDinners, likeDinner };