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
    wx.request({
      url: `http://127.0.0.1:8000/user/wx/list/${userId}/`,  // 接口路径需与后端路由对应
      method: 'GET',
      header: {
        'token': wx.getStorageSync('token')  // 携带登录凭证（如果接口需要认证）
      },
      success: (res) => {
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
