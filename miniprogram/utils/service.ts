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
        console.log("POST", res.data);
        resolve(res.data.data);
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

const getDinners = (): Promise<any> => {
  return callContainer("api/dinners/", "GET");
};

const uploadDinner = (dinnerData: object): Promise<any> => {
  return callContainer("api/dinners/", "POST", dinnerData);
};

const login = (body: object): Promise<any> => {
  return callContainer("api/login/", "POST", body);
};

export { getDinners, uploadDinner, login };