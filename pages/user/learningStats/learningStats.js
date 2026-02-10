const app = getApp();
const bktService = require('../../../utils/bktService');

Page({
  data: {
    userInfo: {},
    profileData:[],
    stats: {
      total_questions: 0,
      avg_mastery: 0,
      stats_list: []
    },
    bktStats: {
      knowledgeCount: 0,
      avgMastery: '0.0',
      learningDays: 0
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
          
          // 在获取到统计数据后，尝试获取BKT统计数据
          this.fetchBKTStats();
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
  },
  
  // 获取BKT统计数据 - 后端已经计算好平均掌握度,直接使用
  async fetchBKTStats() {
    try {
      const token = wx.getStorageSync('accessToken');
      const userId = wx.getStorageSync('userId');
      
      if (!token || !userId) {
        return;
      }
      
      // 后端返回的数据已包含统计信息,直接使用
      const profileData = await bktService.getStudentProfile(userId);
      console.log('后端返回的BKT统计数据:', profileData);

      if (profileData) {
        this.setData({
          bktStats: {
            knowledgeCount: profileData.total_knowledge_points || 0,
            avgMastery: (profileData.summary.average_mastery * 100).toFixed(1),
            learningDays: profileData.learning_days || 0
          }
        });
      }
    } catch (error) {
      console.error("获取BKT统计数据失败", error);
      // 静默处理,不影响主功能
    }
  },
  
  viewBKTProfile() {
    wx.navigateTo({
      url: '/pages/student_mode/learningInsights/knowledgeProfile'
    });
  }
});