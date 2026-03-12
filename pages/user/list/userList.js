const app = getApp();

Page({
  data: {
    userInfo: {},
    loading: true
  },

  onLoad() {
    this.setData({
      animationClass: 'fade-in'
    });
  },

  onShow() {
    const userId = wx.getStorageSync('userId');
    if (userId) {
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
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  }
});
