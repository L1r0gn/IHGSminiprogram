const app = getApp();

Page({
  data: {
    userInfo: {},
    loading: true,
    cachedAvatarUrl: null
  },

  onLoad() {
    this.setData({
      animationClass: 'fade-in'
    });
  },

  onShow() {
    const userId = wx.getStorageSync('userId');
    if (userId) {
      // 先从缓存加载头像
      this.loadAvatarFromCache();
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
    if (!avatarUrl || avatarUrl === 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0') {
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

  getUserDetail(userId) {
    const token = wx.getStorageSync('accessToken');
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
        console.log('收到用户数据:', res.data.data);

        const userInfo = res.data.data || {};

        // 预处理数据
        const attrMap = {
          0: '未定义',
          1: '学生',
          2: '老师',
          3: '管理员',
          4: '超级管理员'
        };

        const genderMap = {
          1: '男',
          2: '女'
        };

        // 计算注册天数
        let registerDays = '-';
        if (userInfo.date_joined) {
          const joinDate = new Date(userInfo.date_joined);
          const now = new Date();
          const diffTime = Math.abs(now - joinDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          registerDays = diffDays > 0 ? diffDays : 1;
        }

        this.setData({
          userInfo: {
            ...userInfo,
            attributeText: attrMap[userInfo.user_attribute] || '未定义',
            genderText: genderMap[userInfo.gender] || '未设置',
            registerDays: registerDays
          },
          loading: false
        });

        // 保存最新头像到缓存
        if (userInfo.wx_avatar) {
          this.saveAvatarToCache(userInfo.wx_avatar);
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  }
});
