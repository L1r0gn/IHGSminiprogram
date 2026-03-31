const app = getApp();

Page({
  data: {
    userInfo: {},
    genderOptions: ['男', '女'],
    genderIndex: -1,
    loading: true,
    cachedAvatarUrl: null
  },

  onLoad() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');

    if (!userId || !token) {
      wx.showToast({ title: '用户信息缺失', icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 先从缓存加载头像
    this.loadAvatarFromCache();

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }

        const user = res.data.user || {};

        // 性别映射
        const genderIndex = user.gender - 1;
        const genderMap = {
          1: '男',
          2: '女'
        };

        this.setData({
          userInfo: {
            ...user,
            genderText: genderMap[user.gender] || '未设置'
          },
          genderIndex: genderIndex >= 0 ? genderIndex : -1,
          loading: false
        });

        // 保存头像到缓存
        if (user.wx_avatar) {
          this.saveAvatarToCache(user.wx_avatar);
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    });
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

  saveToServer() {
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');
    const { userInfo, genderIndex } = this.data;

    if (genderIndex < 0) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }

    const requestData = {
      gender: genderIndex + 1,
      phone: userInfo.phone || '',
      nickName: userInfo.wx_nickName || '',
      avatarUrl: userInfo.wx_avatar || ''
    };

    wx.showLoading({ title: '保存中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: requestData,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onGenderChange(e) {
    const idx = Number(e.detail.value);
    const genderMap = {
      1: '男',
      2: '女'
    };
    this.setData({
      genderIndex: idx,
      'userInfo.gender': idx + 1,
      'userInfo.genderText': genderMap[idx + 1]
    });
  },

  onNicknameInput(e) {
    this.setData({ 'userInfo.wx_nickName': e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ 'userInfo.phone': e.detail.value });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      ['userInfo.wx_avatar']: avatarUrl,
      cachedAvatarUrl: avatarUrl
    });
    this.uploadAvatar(avatarUrl);
    this.saveAvatarToCache(avatarUrl);
  },

  uploadAvatar(tempPath) {
    const token = wx.getStorageSync('accessToken');
    wx.showLoading({ title: '上传头像中...' });

    wx.uploadFile({
      url: `${app.globalData.globalUrl}/user/wx/upload/avatar/`,
      filePath: tempPath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error('解析上传响应失败', e);
          wx.showToast({ title: '上传失败', icon: 'none' });
          return;
        }

        if (res.statusCode === 200 && data.url) {
          this.setData({
            ['userInfo.wx_avatar']: data.url
          });
          wx.showToast({ title: '头像上传成功', icon: 'success' });
        } else {
          wx.showToast({ title: data.message || '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传头像失败', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
