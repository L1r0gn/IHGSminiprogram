// pages/user/list/userList.js
Page({
  data: {
    // queryset: [],
    // currentUserId: null,
    userInfo: {}
  },
  
  onLoad: function () {
    const userId = wx.getStorageSync('userId');
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {this.setData({ userInfo: userInfo });}
    if (userId) {
      this.getUserDetail(userId);
    } else {
      console.log('暂无用户数据，正在跳转到登录页面');
      wx.navigateTo({
        url: '/pages/login/login',
        success: () => {
          console.log("跳转登录页面成功");
        }
      });
    }
  },
  getUserDetail(userId) {
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `http://127.0.0.1:8000/user/wx/list/${userId}/`,  // 接口路径需与后端路由对应
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          wx.removeStorageSync('accessToken');
          wx.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
