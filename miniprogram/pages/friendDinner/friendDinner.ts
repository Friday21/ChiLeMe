import { getFriendDinners, likeDinner } from '../../utils/service';
const app = getApp<IAppOption>();

Component({
  data: {
    dinners: [],
  },

  lifetimes: {
    attached() {
      console.log("Home component attached");

      this.waitForOpenId()
        .then(openId => {
          console.log("openId received", openId);
          // 使用 `this.methods?.loadDinners?.()` 以避免 TypeScript 报错
          this.loadDinners();
        })
        .catch(err => {
          console.error(err);
        });
    }
  },

  methods: {
    waitForOpenId() {
      return new Promise<string>((resolve, reject) => {
        const maxWaitTime = 30000;
        let waitedTime = 0;

        let checkInterval = setInterval(() => {
          if (app.globalData.openId) {
            clearInterval(checkInterval);
            resolve(app.globalData.openId);
          } else {
            waitedTime += 100;
            if (waitedTime >= maxWaitTime) {
              clearInterval(checkInterval);
              reject('waitForOpenId timeout');
            }
          }
        }, 100);
      });
    },

    onPullDownRefresh() {
      console.log("pull down");
      this.setData({ dinners: [] });
      this.loadDinners();
      wx.stopPullDownRefresh();
    },

    loadDinners() {
      console.log("Loading friend dinners...");
      getFriendDinners(app.globalData.openId!)
        .then(dinnerData => {
          this.setData({ dinners: dinnerData });
        })
        .catch(err => {
          console.error('获取 dinners 失败:', err);
        });
    },

    updateDinner(dinner: any) {
      let updatedDinners = this.data.dinners.map(item =>
        item.id === dinner.id ? dinner : item
      );
      this.setData({ dinners: updatedDinners });
    },

    rateHealthy(event: any) {
      let body = {
        from_openId: app.globalData.openId,
        dinner_id: event.currentTarget.dataset.id,
        healthy_star: event.detail,
      };
      likeDinner(body)
        .then(dinner => {
          this.updateDinner(dinner);
        })
        .catch(error => {
          console.error('Upload failed', error);
        });
    },

    rateDelicious(event: any) {
      let body = {
        from_openId: app.globalData.openId,
        dinner_id: event.currentTarget.dataset.id,
        delicious_star: event.detail,
      };
      likeDinner(body)
        .then(dinner => {
          this.updateDinner(dinner);
        })
        .catch(error => {
          console.error('Upload failed', error);
        });
    },

    rateBeauty(event: any) {
      let body = {
        from_openId: app.globalData.openId,
        dinner_id: event.currentTarget.dataset.id,
        beauty_star: event.detail,
      };
      likeDinner(body)
        .then(dinner => {
          this.updateDinner(dinner);
        })
        .catch(error => {
          console.error('Upload failed', error);
        });
    },

    preview(event: any) {
      let currentUrl = event.currentTarget.dataset.src;
      wx.previewImage({
        current: currentUrl,
        urls: [currentUrl],
      });
    },
  },
});
