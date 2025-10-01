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
  // 统一的登录处理函数
  handleLogin() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请填写头像和昵称',
        icon: 'none'
      });
      return;
    }
    // 调用登录服务器的逻辑
    this.loginToServer(this.data.userInfo);
  },
  loginToServer(userInfo) {
    wx.login({
      success: (loginRes) => {
        // ... wx.showLoading 不变 ...
        const app = getApp(); // 建议从全局获取URL
        wx.request({
          // [注意] 这里的 URL 应该和你之前 postman 或其他地方测试的登录 URL 一致
          // 我将它改为我们之前定义的 URL 结构
          url: `${app.globalData.globalUrl}/user/wx/login/`, // 请确保这个 URL 是正确的
          method: 'POST',
          data: {
            code: loginRes.code,
            // 后面我们会讨论如何把 userInfo 也传过去
          },
          success: (res) => {
            wx.hideLoading();
            // [修改] 后端直接返回 token，成功由 HTTP 状态码 200 判断，无需 code === 200
            if (res.statusCode === 200 && res.data.access) { 
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
              // 保存新的 accessToken 和 refreshToken
              wx.setStorageSync('accessToken', res.data.access);
              wx.setStorageSync('refreshToken', res.data.refresh);
              // 其他的可以保留
              wx.setStorageSync('isLoggedIn', true);
              wx.setStorageSync('userId', res.data.user_id);
              // 登录成功后跳转到首页或用户中心
              setTimeout(() => {
                wx.switchTab({ // 如果是 Tab 栏页面，请使用 switchTab
                  url: '/pages/index/index',
                });
              }, 1000);
  
            } else {
              // ... 登录失败逻辑不变 ...
            }
          },
          // ... fail 逻辑不变 ...
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
