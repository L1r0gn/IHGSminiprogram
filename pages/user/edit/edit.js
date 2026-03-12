const app = getApp();

Page({
  data: {
    userInfo: {},
    genderOptions: ['男', '女'],
    genderIndex: -1,
    loading: true
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
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    });
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
      ['userInfo.wx_avatar']: avatarUrl
    });
    this.uploadAvatar(avatarUrl);
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
