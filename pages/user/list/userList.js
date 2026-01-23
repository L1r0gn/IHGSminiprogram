// pages/user/list/userList.js
Page({
  data: {
    userInfo: {}
  },
  
  onShow: function () {
    const userId = wx.getStorageSync('userId');
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
    const app = getApp();
    // 发起请求
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,  
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        //保存数据
        console.log('收到用户数据:',res.data.data);
        this.setData({
          userInfo:res.data.data,
        })
        console.log('缓存的用户数据:',this.data.userInfo);
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
