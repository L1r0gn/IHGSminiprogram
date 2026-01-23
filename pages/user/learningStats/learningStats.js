const app = getApp();

Page({
  data: {
    userInfo: {},
    stats: {
      total_questions: 0,
      avg_mastery: 0,
      stats_list: []
    },
    loading: true
  },

  onLoad() {
    // 获取用户信息用于展示昵称
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
    
    this.fetchStats();
  },
  
  onPullDownRefresh() {
    this.fetchStats(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchStats(callback) {
    const token = wx.getStorageSync('accessToken');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/student/stats/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            stats: res.data.data,
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error("获取统计失败", err);
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        if (callback) callback();
      }
    });
  }
});