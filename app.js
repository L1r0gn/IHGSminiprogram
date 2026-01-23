// app.js
App({
  globalData: {
    userInfo: null,
    // globalUrl:'http://119.29.152.140:8000'
    globalUrl:'http://127.0.0.1:8000'
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  handleTokenExpired() {
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('userId');
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
  },
})
