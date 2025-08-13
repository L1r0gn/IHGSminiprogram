// login.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

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
      this.setData({
        userInfo: savedUserInfo,
        hasUserInfo: true
      });
      this.autoLogin(); // 自动登录（可选）
    } else {
      console.log('需要手动登录');
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const { nickName } = this.data.userInfo;
    // 更新本地数据
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      loginFailed: false
    });
    // 保存头像到本地存储
    wx.setStorageSync('userInfo', this.data.userInfo);
    console.log(avatarUrl);
  },

  onInputChange(e) {
    const nickName = e.detail.value;
    const { avatarUrl } = this.data.userInfo;
    // 更新本地数据
    this.setData({
      'userInfo.nickName': nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      loginFailed: false
    });
    // 保存昵称到本地存储
    wx.setStorageSync('userInfo', this.data.userInfo);
    console.log(nickName);
  },

  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息
    console.log('正在向服务器获取用户数据');
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途
      success: (res) => {
        console.log(res);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          loginFailed: false
        });
        // 保存到本地存储
        wx.setStorageSync('userInfo', res.userInfo);
        console.log('userData saved in local');
        // 登录服务器
        this.loginToServer(res.userInfo);
      },
      fail: (err) => {
        console.error("获取用户信息失败", err);
        this.setData({
          loginFailed: true
        });
      }
    });
  },

  loginToServer(userInfo) {
    wx.login({
      success: (loginRes) => {
        wx.showLoading({
          title: '登陆中……',
          mask: true
        });
        wx.request({
          url: 'http://127.0.0.1:8000/user/wx/login',
          method: 'POST',
          data: {
            // nickName: userInfo.nickName,
            // avatarUrl: userInfo.avatarUrl,
            code: loginRes.code,
          },
          success: (res) => {
            wx.hideLoading();
            if (res.data.code === 200) {
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
              wx.setStorageSync('token', res.data.token);
              wx.setStorageSync('isLoggedIn', true);
              wx.setStorageSync('userId', res.data.user_id);
              setTimeout(() => {
                wx.redirectTo({
                  url: '/pages/user/list/userList',
                });
              }, 1000);
            } else {
              this.setData({
                loginFailed: true
              });
              wx.showToast({
                title: res.data.message || '登录失败，请重试',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({
              loginFailed: true
            });
            wx.showToast({
              title: '网络错误，请重试',
            });
            console.error('登录失败请重试', err);
          }
        });
      },
    });
  },

  autoLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.loginToServer(userInfo);
    }
  }
});
