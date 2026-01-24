// app.js
App({
  globalData: {
    userInfo: null,
    // globalUrl:'http://119.29.152.140:8000'
    globalUrl: 'http://127.0.0.1:8000'
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态一致性
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    if (token && !userId) {
      console.log("检测到Token存在但无UserID，清理缓存");
      wx.removeStorageSync('accessToken');
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('isLoggedIn');
    }
  },
  handleTokenExpired() {
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userId');
    wx.removeStorageSync('isLoggedIn');
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
  },
})
