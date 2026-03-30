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
    systemName: '智能批改作业系统',
    cachedAvatarUrl: null
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

    // 先从缓存获取头像
    this.loadAvatarFromCache();

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
          this.saveAvatarToCache(res.data.data.wx_avatar);
        }
      },
    })
  },

  // 从缓存加载头像
  loadAvatarFromCache() {
    const avatarCache = wx.getStorageSync('avatarCache');
    const now = Date.now();

    if (avatarCache && avatarCache.expires > now) {
      // 缓存有效
      console.log('使用缓存的头像:', avatarCache.avatarUrl);
      this.setData({
        cachedAvatarUrl: avatarCache.avatarUrl
      });
    } else if (avatarCache && avatarCache.expires <= now) {
      // 缓存过期，清除
      console.log('头像缓存已过期');
      wx.removeStorageSync('avatarCache');
      this.setData({
        cachedAvatarUrl: null
      });
    }
  },

  // 保存头像到缓存
  saveAvatarToCache(avatarUrl) {
    if (!avatarUrl || avatarUrl === defaultAvatarUrl) {
      return;
    }

    const timestamp = Date.now();
    const avatarCache = wx.getStorageSync('avatarCache') || {};

    // 如果新头像与缓存不同，更新缓存
    if (!avatarCache.avatarUrl || avatarCache.avatarUrl !== avatarUrl) {
      const cacheData = {
        avatarUrl: avatarUrl,
        timestamp: timestamp,
        expires: timestamp + (30 * 24 * 60 * 60 * 1000) // 30天后过期
      };
      wx.setStorageSync('avatarCache', cacheData);
      console.log('头像已更新到缓存:', avatarUrl);
      this.setData({
        cachedAvatarUrl: avatarUrl
      });
    }
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