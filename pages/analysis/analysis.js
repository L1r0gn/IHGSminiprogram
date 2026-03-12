const app = getApp();
const bktService = require('../../utils/bktService');

Page({
  data: {
    // BKT 分析相关数据
    bktData: {
      knowledgeCount: 0,
      avgMastery: '0.0',
      learningDays: 0,
      knowledgePoints: []
    },
    // 做题记录相关数据
    submissionData: {
      totalCount: 0,
      avgAccuracy: 0,
      dailyRecords: [],
      submissions: []
    },
    loading: true,
    empty: false,
    currentTab: 'bkt',
    tabs: [
      { id: 'bkt', name: '知识掌握' },
      { id: 'submission', name: '做题记录' }
    ],
    // 分页相关
    currentPage: 1,
    pageSize: 20,
    // 滑动动画相关
    slideDirection: '' // 'left' 或 'right'
  },

  onLoad() {
    this.loadAllData();
  },

  onShow() {
    const app = getApp();

    // 如果 tab 切换了，重新加载页面
    if (app.globalData.currentTab !== 'analysis') {
      app.globalData.currentTab = 'analysis';
      wx.reLaunch({
        url: '/pages/analysis/analysis'
      });
      return;
    }

    this.loadAllData();
  },

  onPullDownRefresh() {
    this.loadAllData(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 切换标签页
  switchTab(e) {
    const tabId = e.currentTarget.dataset.tab;
    const currentTab = this.data.currentTab;

    // 如果点击的是当前标签，不做任何操作
    if (currentTab === tabId) {
      return;
    }

    // 确定滑动方向
    const slideDirection = tabId === 'submission' ? 'left' : 'right';

    // 滚动到页面顶部
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });

    // 先设置滑动方向，触发滑动动画
    this.setData({
      slideDirection: slideDirection
    });

    // 短暂延迟后切换标签，让动画先播放
    setTimeout(() => {
      this.setData({
        currentTab: tabId
      });
    }, 100);
  },

  // 触底加载更多 - 已禁用，只显示前20条
  onReachBottom() {
    // 不再加载更多数据
  },

  // 格式化概率值为百分比
  formatProbability(value) {
    const num = parseFloat(value) || 0;
    const isDecimal = num > 0 && num < 1;
    return isDecimal ? (num * 100).toFixed(1) : num.toFixed(1);
  },

  // 加载所有数据
  loadAllData(callback) {
    const token = wx.getStorageSync('accessToken');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ loading: false, empty: true });
      return;
    }

    this.setData({ loading: true });

    // 并行加载 BKT 数据和做题记录
    Promise.all([
      this.loadBKTData(),
      this.loadSubmissionData()
    ]).then(() => {
      this.setData({ loading: false });
      if (callback) callback();
    }).catch(err => {
      console.error('加载数据失败', err);
      wx.showToast({ title: '加载数据失败', icon: 'none' });
      this.setData({ loading: false, empty: true });
      if (callback) callback();
    });
  },

  // 加载 BKT 数据
  async loadBKTData() {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        return;
      }
      
      // 获取用户信息以计算注册天数
      let learningDays = 0;
      const token = wx.getStorageSync('accessToken');
      try {
        const userInfoRes = await new Promise((resolve, reject) => {
          wx.request({
            url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
            method: 'GET',
            header: { 'Authorization': `Bearer ${token}` },
            success: resolve,
            fail: reject
          });
        });
        
        if (userInfoRes.statusCode === 200 && userInfoRes.data.data) {
          const userInfo = userInfoRes.data.data;
          if (userInfo.date_joined) {
            const joinDate = new Date(userInfo.date_joined);
            const now = new Date();
            const diffTime = Math.abs(now - joinDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            learningDays = diffDays > 0 ? diffDays : 1;
          }
        }
      } catch (err) {
        console.error('获取用户信息失败', err);
      }
      
      const profileData = await bktService.getStudentProfile(userId);
      console.log('BKT数据:', profileData);

      const knowledgePoints = (profileData.knowledge_points || []).map(kp => {
        return {
          ...kp,
          mastery_probability_formatted: this.formatProbability(kp.mastery_probability)
        };
      });

      if (profileData) {
        const avgMasteryValue = profileData.summary?.average_mastery || 0;
        
        this.setData({
          bktData: {
            knowledgeCount: profileData.total_knowledge_points || 0,
            avgMastery: this.formatProbability(avgMasteryValue),
            learningDays: learningDays,
            knowledgePoints: knowledgePoints.slice(0, 6)
          }
        });
      }
    } catch (error) {
      console.error("获取BKT数据失败", error);
    }
  },

  // 加载做题记录数据
  loadSubmissionData() {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('accessToken');
      
      wx.request({
        url: `${app.globalData.globalUrl}/grading/wx/submissions/`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          page: 1,
          limit: this.data.pageSize,
          sort_by: 'submitted_time:desc'
        },
        success: (res) => {
          if (res.data.data) {
            console.log('做题记录数据:', res.data.data);
            const submissions = (res.data.data || []).map(item => {
              // 根据得分率计算状态
              const studentScore = item.student_score || item.score || 0;
              const questionScore = item.question_score || 10;
              const scoreRatio = questionScore > 0 ? (studentScore / questionScore) : 0;

              let computedStatus = item.status || 'PENDING';
              if (scoreRatio >= 1) {
                computedStatus = 'ACCEPTED';
              } else if (scoreRatio >= 0.5) {
                computedStatus = 'PARTIALLY_CORRECT';
              } else {
                computedStatus = 'WRONG_ANSWER';
              }

              return {
                id: item.record_id,
                question_id: item.question_id,
                question_title: item.question_title,
                is_correct: scoreRatio >= 1,
                score: item.score,
                student_score: studentScore,
                question_score: questionScore,
                status: computedStatus,
                created_at: item.created_at,
                accuracy: scoreRatio * 100
              };
            });

            // 计算总正确率
            const totalCorrect = submissions.filter(s => s.is_correct).length;
            const avgAccuracy = submissions.length > 0 ? (totalCorrect / submissions.length * 100) : 0;

            // 按日期分组统计
            const dateMap = {};
            submissions.forEach(submission => {
              const date = submission.created_at ? submission.created_at.split(' ')[0] : '未知日期';
              if (!dateMap[date]) {
                dateMap[date] = { date, count: 0, correct: 0 };
              }
              dateMap[date].count += 1;
              if (submission.is_correct) {
                dateMap[date].correct += 1;
              }
            });

            // 预处理每个提交记录的状态样式和文本
            const processedSubmissions = submissions.map(sub => ({
              ...sub,
              statusClass: this.getStatusClass(sub.status),
              statusText: this.getStatusText(sub.status)
            }));

            // 转换为数组并格式化正确率
            const dailyRecords = Object.values(dateMap).map(item => {
              const accuracy = item.count > 0 ? (item.correct / item.count * 100) : 0;
              return {
                date: item.date,
                count: item.count,
                accuracy: accuracy,
                accuracy_formatted: this.formatProbability(accuracy)
              };
            }).sort((a, b) => new Date(b.date) - new Date(a.date));

            this.setData({
              submissionData: {
                totalCount: res.data.total_count || submissions.length,
                avgAccuracy: avgAccuracy,
                avgAccuracy_formatted: this.formatProbability(avgAccuracy),
                dailyRecords: dailyRecords,
                submissions: processedSubmissions
              },
              currentPage: 1,
              empty: submissions.length === 0
            });
            resolve();
          } else {
            this.setData({ empty: true });
            reject(new Error('获取做题记录失败'));
          }
        },
        fail: (err) => {
          console.error("获取做题记录失败", err);
          wx.showToast({ title: '网络请求失败', icon: 'none' });
          this.setData({ empty: true });
          reject(err);
        }
      });
    });
  },

  // 加载更多做题记录 - 已禁用
  loadMoreSubmissions() {
    // 不再支持加载更多，只显示前20条记录
  },

  // 查看知识详情
  viewKnowledgeDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/student_mode/learningInsights/knowledgeDetail?knowledgeId=${item.id}`
    });
  },

  // 查看更多知识点
  viewMoreKnowledge() {
    wx.navigateTo({
      url: '/pages/student_mode/learningInsights/knowledgeProfile'
    });
  },

  // 查看做题记录详情
  viewSubmissionDetail() {
    wx.navigateTo({
      url: '/pages/user/learningStats/learningStats'
    });
  },

  // 跳转到提交记录
  goToLearningStats() {
    wx.navigateTo({
      url: '/pages/user/learningStats/learningStats'
    });
  },

  // 获取状态样式类名
  getStatusClass(status) {
    const statusMap = {
      'ACCEPTED': 'correct',
      'GRADED': 'correct',
      'PARTIALLY_CORRECT': 'partial',
      'WRONG_ANSWER': 'wrong',
      'RUNTIME_ERROR': 'wrong',
      'PENDING': 'pending'
    };
    return statusMap[status] || 'pending';
  },

  // 获取状态文本
  getStatusText(status) {
    const textMap = {
      'ACCEPTED': '正确',
      'GRADED': '已评分',
      'PARTIALLY_CORRECT': '部分正确',
      'WRONG_ANSWER': '错误',
      'RUNTIME_ERROR': '运行错误',
      'PENDING': '待批改'
    };
    return textMap[status] || status || '未知状态';
  },

  // 跳转到提交记录详情
  goToSubmissionDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '记录ID无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/user/submissionDetail/submissionDetail?submissionId=${id}`
    });
  }
});
