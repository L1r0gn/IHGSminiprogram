// login.js
const defaultAvatarUrl =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    loginFailed: false,
    showProfileModal: false,
    genderOptions: ['男', '女'],
    genderIndex: -1,
    roleOptions: ['学生', '教师'],
    roleIndex: -1,
    phone: '',
    isFromLogin: false
  },

  onLoad() {
    const savedUserInfo = wx.getStorageSync('userInfo');
    if (savedUserInfo && savedUserInfo.nickName) {
      console.log('用户有本地保存数据，可自动登录');

      // 检查头像是否为临时路径 (以 http://tmp, wxfile://, http://127.0.0.1 开头)
      // 如果是临时路径，则视为已过期，重置为默认头像
      const avatarUrl = savedUserInfo.avatarUrl || defaultAvatarUrl;
      const isTempPath = typeof avatarUrl === 'string' && (
        avatarUrl.startsWith('http://tmp') ||
        avatarUrl.startsWith('wxfile://') ||
        avatarUrl.includes('127.0.0.1') ||
        avatarUrl.startsWith('blob:')
      );

      let finalUserInfo = { ...savedUserInfo };
      if (isTempPath) {
        console.log('检测到缓存的头像为临时路径，已重置');
        finalUserInfo.avatarUrl = defaultAvatarUrl;
        // 更新本地缓存，避免下次继续报错
        wx.setStorageSync('userInfo', finalUserInfo);
      }

      // 计算 hasUserInfo: 需要同时有昵称且头像不为默认头像
      const hasUserInfo = savedUserInfo.nickName &&
        finalUserInfo.avatarUrl &&
        finalUserInfo.avatarUrl !== defaultAvatarUrl;

      this.setData({
        userInfo: finalUserInfo,
        hasUserInfo
      });
      this.autoLogin(); // 自动登录（可选）
    } else {
      console.log('需要手动登录');
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('新头像临时路径:', avatarUrl);
    const currentNickName = this.data.userInfo.nickName;
    const hasUserInfo = currentNickName && avatarUrl && avatarUrl !== defaultAvatarUrl;
    this.setData({
      ['userInfo.avatarUrl']: avatarUrl,
      ['userInfo.wx_avatar']: avatarUrl,
      hasUserInfo: hasUserInfo,
      loginFailed: false
    });
  },
  uploadAvatar(tempPath) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');

    wx.showLoading({ title: '上传头像中...' });

    wx.uploadFile({
      url: `${app.globalData.globalUrl}/user/wx/upload/avatar/`, // 假设后端有此上传接口
      filePath: tempPath,
      name: 'avatar', // 对应后端接收的文件字段名
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        console.log('上传结果:', res);

        // wx.uploadFile 返回的 data 是 string 类型
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error('解析上传响应失败', e);
          wx.showToast({ title: '上传失败', icon: 'none' });
          return;
        }

        if (res.statusCode === 200 && data.url) {
          console.log('头像上传成功，永久URL:', data.url);
          // 将永久 URL 更新到 userInfo 中，以便 saveToServer 提交
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
  },
  onInputChange(e) {
    const nickName = e.detail.value;
    const currentAvatarUrl = this.data.userInfo.avatarUrl;
    const hasUserInfo = nickName && currentAvatarUrl && currentAvatarUrl !== defaultAvatarUrl;
    this.setData({
      ['userInfo.nickName']: nickName,
      hasUserInfo: hasUserInfo,
      loginFailed: false
    });
    console.log(nickName);
  },

  handleLogin() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请填写头像和昵称',
        icon: 'none'
      });
      return;
    }
    this.loginToServer(this.data.userInfo);
  },
  
  loginToServer(userInfo) {
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: (loginRes) => {
        const app = getApp();
        wx.request({
          url: `${app.globalData.globalUrl}/user/wx/login/`,
          method: 'POST',
          data: {
            code: loginRes.code,
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          },
          success: (res) => {
            wx.hideLoading();

            if (res.statusCode === 401) {
              wx.showToast({ title: '授权已失效，请重新授权', icon: 'none' });
              this.setData({ loginFailed: true });
              return;
            }

            if (res.statusCode === 200 && res.data.access) {
              if (!res.data.user_id) {
                console.error("Login response missing user_id", res.data);
                wx.showToast({ title: '登录异常: 无用户ID', icon: 'none' });
                return;
              }
              wx.setStorageSync('accessToken', res.data.access);
              wx.setStorageSync('refreshToken', res.data.refresh);
              wx.setStorageSync('isLoggedIn', true);
              wx.setStorageSync('userId', res.data.user_id);

              // 检查用户是否需要补充个人信息
              this.checkUserProfile(res.data.user_id);
            } else {
              wx.showToast({ title: '登录失败', icon: 'none' });
              this.setData({ loginFailed: true });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('登录请求失败', err);
            wx.showToast({ title: '网络错误', icon: 'none' });
            this.setData({ loginFailed: true });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('wx.login 失败', err);
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },
  autoLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.loginToServer(userInfo);
    }
  },

  // 检查用户是否需要补充个人信息
  checkUserProfile(userId) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200 && res.data.data) {
          const user = res.data.data;
          // 检查是否有性别和属性
          if (!user.gender || !user.user_attribute) {
            // 需要补充信息，显示弹窗
            this.setData({
              showProfileModal: true,
              isFromLogin: true
            });
          } else {
            // 已有信息，直接跳转
            this.navigateAfterLogin();
          }
        }
      },
      fail: () => {
        // 请求失败时也直接跳转
        this.navigateAfterLogin();
      }
    });
  },

  // 登录成功后的跳转
  navigateAfterLogin() {
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  stopPropagation() {
    // 阻止冒泡
  },

  // 性别选择
  onGenderChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      genderIndex: idx
    });
  },

  // 属性选择
  onRoleChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      roleIndex: idx
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 提交个人信息
  submitProfile() {
    const { genderIndex, roleIndex, phone, isFromLogin } = this.data;

    if (genderIndex < 0) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }

    if (roleIndex < 0) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');

    wx.showLoading({ title: '保存中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: {
        gender: genderIndex + 1,
        user_attribute: roleIndex + 1,
        phone: phone
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          this.setData({ showProfileModal: false });
          if (isFromLogin) {
            this.navigateAfterLogin();
          }
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
  }
});
