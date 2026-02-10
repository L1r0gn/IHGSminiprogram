// pages/student_mode/learningInsights/knowledgeProfile.js
// 学生知识画像页面

const bktService = require('../../../utils/bktService.js');

Page({
  data: {
    studentId: null,
    isLoading: true,
    profileData: null,
    knowledgePoints: [],
    selectedCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'strong', name: '掌握良好' },
      { id: 'weak', name: '需要加强' },
      { id: 'learning', name: '学习中' }
    ],
    showSuggestions: false,
    // 添加格式化的显示字段
    formattedAvgMastery: '0.0'
  },

  onLoad: function(options) {
    //获取学生ID
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }

    this.setData({
      studentId: userId
    });
    
    this.loadKnowledgeProfile();
  },

  // 加载知识画像数据
  async loadKnowledgeProfile() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 后端已经处理好所有数据,直接使用即可
      const profileData = await bktService.getStudentProfile(this.data.studentId);
      console.log('后端返回的完整数据:', profileData);
      
      const knowledgePoints = (profileData.knowledge_points || []).map(kp=>{
        return {
          ...kp,
          mastery_probability_formatted: (kp.mastery_probability * 100).toFixed(1)
        }
      })

      // 格式化平均掌握度用于显示
      const formattedAvgMastery = (profileData.summary.average_mastery * 100).toFixed(1);
      
      // 直接设置后端返回的数据
      this.setData({
        profileData: profileData,
        knowledgePoints: knowledgePoints,
        formattedAvgMastery: formattedAvgMastery,
      });
      
    } catch (error) {
      console.error('加载知识画像失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },



  // 切换分类筛选
  onCategoryChange: function(e) {
    const categoryId = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: categoryId
    });
  },

  // 获取筛选后的知识点 
  getFilteredKnowledgePoints: function() {
    const { knowledgePoints, selectedCategory } = this.data;

    if (!Array.isArray(knowledgePoints) || selectedCategory === 'all') {
      return knowledgePoints || [];
    }

    // 后端返回的category字段直接使用
    return knowledgePoints.filter(point => {
      if (!point) return false;
      const p = Number(point.mastery_probability_formatted);
      if (isNaN(p)) return false; // 防止无效值
      return (selectedCategory === 'strong' && p >= 85) ||
             (selectedCategory === 'learning' && p >= 60) ||
             (selectedCategory === 'weak' && p < 60);
    });
  },

  // 点击知识点查看详情
  onKnowledgePointTap: function(e) {
    const knowledgePointId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/student_mode/learningInsights/knowledgeDetail?knowledgePointId=${knowledgePointId}`
    });
  },

  // 刷新数据
  onPullDownRefresh: function() {
    this.loadKnowledgeProfile().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 显示学习建议 (后端wei生成,直接使用)
  toggleSuggestions: function() {
    this.setData({
      showSuggestions: !this.data.showSuggestions
    });
  },

  // 跳转到自适应练习
  goToPractice: function() {
    wx.navigateTo({
      url: '/pages/student_mode/question/search/search'
    })
  },

  // 跳转到学习统计
  goToLearningStats: function() {
    wx.navigateBack();
  }
});