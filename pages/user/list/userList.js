// pages/user/list/userList.js// pages/userList/userList.js
Page({
  data: {
    queryset: [],
    currentUserId : null
  },
  onLoad: function() {
    const userId = wx.getStorageSync('userId');
    if(userId){
      this.setData({userId : userId});
      this.getUserDetail(userId);
    } else {
      console.log('暂无用户数据，正在跳转到登录页面')
      wx.redirectTo({
        url: '/pages/index/index',
      })
    }
  },

  getUserDetail() {
    // 从本地存储获取当前登录用户的 userId
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '未登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `http://127.0.0.1:8000/user/wx/list/${userId}/`,  // 接口路径需与后端路由对应
      method: 'GET',
      header: {
        'token': wx.getStorageSync('token')  // 携带登录凭证（如果接口需要认证）
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 后端返回格式：{data: {id: ..., wx_nickName: ...}}
          this.setData({
            userInfo: res.data.data  // 直接赋值对象，无需解析列表
          });
        } else {
          wx.showToast({ title: res.data.error || '获取信息失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});