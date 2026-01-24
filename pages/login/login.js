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
  },

  onLoad() {
    const savedUserInfo = wx.getStorageSync('userInfo');
    if (savedUserInfo) {
      console.log('用户有本地保存数据，可自动登录');

      // 检查头像是否为临时路径 (以 http://tmp, wxfile://, http://127.0.0.1 开头)
      // 如果是临时路径，则视为已过期，重置为默认头像
      let validAvatar = savedUserInfo.avatarUrl;
      const isTempPath = validAvatar && (
        validAvatar.startsWith('http://tmp') ||
        validAvatar.startsWith('wxfile://') ||
        validAvatar.includes('127.0.0.1') ||
        validAvatar.startsWith('blob:')
      );

      if (isTempPath) {
        console.log('检测到缓存的头像为临时路径，已重置');
        validAvatar = defaultAvatarUrl;
        // 更新本地缓存，避免下次继续报错
        savedUserInfo.avatarUrl = defaultAvatarUrl;
        wx.setStorageSync('userInfo', savedUserInfo);
      }

      this.setData({
        userInfo: savedUserInfo,
        hasUserInfo: savedUserInfo.nickName &&
          validAvatar &&
          validAvatar !== defaultAvatarUrl
      });
      this.autoLogin(); // 自动登录（可选）
    } else {
      console.log('需要手动登录');
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const currentNickName = this.data.userInfo.nickName;

    const newUserInfo = {
      nickName: currentNickName,
      avatarUrl: avatarUrl
    };

    const hasUserInfo = currentNickName && avatarUrl && avatarUrl !== defaultAvatarUrl;

    this.setData({
      userInfo: newUserInfo,
      hasUserInfo: hasUserInfo,
      loginFailed: false
    });

    wx.setStorageSync('userInfo', newUserInfo);
    console.log(avatarUrl);
  },

  onInputChange(e) {
    const nickName = e.detail.value;
    const currentAvatarUrl = this.data.userInfo.avatarUrl;

    const newUserInfo = {
      nickName: nickName,
      avatarUrl: currentAvatarUrl
    };

    const hasUserInfo = nickName && currentAvatarUrl && currentAvatarUrl !== defaultAvatarUrl;

    this.setData({
      userInfo: newUserInfo,
      hasUserInfo: hasUserInfo,
      loginFailed: false
    });

    wx.setStorageSync('userInfo', newUserInfo);
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
            if (res.statusCode === 200 && res.data.access) {
              if (!res.data.user_id) {
                console.error("Login response missing user_id", res.data);
                wx.showToast({ title: '登录异常: 无用户ID', icon: 'none' });
                return;
              }
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
              wx.setStorageSync('accessToken', res.data.access);
              wx.setStorageSync('refreshToken', res.data.refresh);
              wx.setStorageSync('isLoggedIn', true);
              wx.setStorageSync('userId', res.data.user_id);

              // 登录成功后跳转
              const pages = getCurrentPages();
              if (pages.length > 1) {
                wx.navigateBack();
              } else {
                wx.switchTab({ url: '/pages/home/home' });
              }
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
  }
});
