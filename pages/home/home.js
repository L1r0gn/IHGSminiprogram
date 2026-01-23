// pages/home/home.js
Page({
  data: {
    userInfo: null,
    isTeacher:false,
    isStudent:false,
  },
  onShow() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    // 尝试从本地存储获取用户信息，如果没有则留空，让用户点击头像获取
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`, 
      method:'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success:(res)=>{
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if(res.statusCode === 200){
          console.log('收到用户数据:',res.data.data);
          this.setData({
            userInfo:res.data.data
          })
          this.updateView();
        }
      },
    })
  },
  updateView() {
    const attr = Number(this.data.userInfo?.user_attribute);
    console.log('用户状态是：',attr);
    this.setData({
      isStudent: attr === 0,    // 根据你的业务定义
      isTeacher: attr === 1   // 根据你的业务定义
    });
  }
})