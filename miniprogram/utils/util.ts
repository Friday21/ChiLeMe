import { createUser } from "./service";

export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}


export const getUserProfile = (openId: string) => {
  const app = getApp<IAppOption>();
  wx.getUserProfile({
    desc: '展示用户信息',
    success: (res) => {
      console.log(res)
      let user = {
        "open_id": openId,
        "avatar_url": res.userInfo.avatarUrl,
        "alias": res.userInfo.nickName
      }
      createUser(user).then(userInfo => {
        app.globalData.userInfo = userInfo;
        console.log("created user", app.globalData.userInfo)
      })
    },
    fail: () => {
      wx.showModal({ 
        title: '提示',
        content: '请允许获取您的用户信息',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            console.log('用户点击确定')
          }
        }
      })
    }
  })
}