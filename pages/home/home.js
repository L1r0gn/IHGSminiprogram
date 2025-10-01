// pages/home/home.js
Page({
  data: {
    userInfo: null
  },
  onLoad(options) {
    // 尝试从本地存储获取用户信息，如果没有则留空，让用户点击头像获取
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserInfo) {
      this.setData({
        userInfo: storedUserInfo
      });
    }
  },

  // 点击头像时触发，获取用户信息
  handleUserProfile() {
    // 如果已经有信息了，就不再请求
    if (this.data.userInfo) return;

    wx.getUserProfile({
      desc: '用于展示您的头像和昵称', // 声明用途
      success: (res) => {
        const userInfo = {
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName,
        };
        this.setData({
          userInfo: userInfo
        });
        // 将用户信息保存到本地存储，方便下次使用
        wx.setStorageSync('userInfo', userInfo);
      },
      fail: (err) => {
        wx.showToast({
          title: '授权后体验更佳',
          icon: 'none'
        });
      }
    });
  }
})