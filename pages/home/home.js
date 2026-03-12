// pages/home/home.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: null,
    defaultAvatarUrl: defaultAvatarUrl,
    isTeacher: false,
    isStudent: false,
    isLoggedIn: false,
    userId: null,
    greeting: '',
    systemName: '智能批改作业系统'
  },
  onShow() {
    const app = getApp();

    // 如果 tab 切换了，重新加载页面
    if (app.globalData.currentTab !== 'home') {
      app.globalData.currentTab = 'home';
      wx.reLaunch({
        url: '/pages/home/home'
      });
      return;
    }

    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');

    this.updateGreeting();

    // 检查登录状态
    if (!token || !userId) {
      console.log('未登录或userId缺失');
      this.setData({
        userInfo: null,
        isTeacher: false,
        isStudent: false,
        isLoggedIn: false
      });
      return;
    }

    this.setData({ isLoggedIn: true });

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
        if (res.statusCode === 200) {
          console.log('收到用户数据:', res.data.data);
          this.setData({
            userInfo: res.data.data
          })
          this.updateView();
        }
      },
    })
  },
  
  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 6 && hour < 12) {
      greeting = '早上好';
    } else if (hour >= 12 && hour < 18) {
      greeting = '中午好';
    } else {
      greeting = '晚上好';
    }
    
    this.setData({ greeting });
  },
  
  handleAvatarTap() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },
  
  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },
  
  startPractice() {
    wx.navigateTo({
      url: '/pages/student_mode/question/search/search'
    });
  },

  updateView() {
    const attr = Number(this.data.userInfo?.user_attribute);
    console.log('用户状态是：', attr);
    this.setData({
      isStudent: attr === 1,
      isTeacher: attr === 2
    });
  }
})