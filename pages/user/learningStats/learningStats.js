const app = getApp();

Page({
  data: {
    submissionData: {
      totalCount: 0,
      avgAccuracy: 0,
      avgAccuracy_formatted: 0,
      dailyRecords: [],
      submissions: []
    },
    loading: true,
    empty: false,
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false
  },

  onLoad() {
    this.loadSubmissions();
  },

  onShow() {
    const appInstance = getApp();
    if (appInstance.globalData.currentTab !== 'learningStats') {
      appInstance.globalData.currentTab = 'learningStats';
      wx.reLaunch({
        url: '/pages/user/learningStats/learningStats'
      });
      return;
    }
  },

  onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      hasMore: true
    });
    this.loadSubmissions(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadMoreSubmissions();
  },

  loadSubmissions(callback) {
    const token = wx.getStorageSync('accessToken');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

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

          // 预处理状态样式和文本
          const processedSubmissions = submissions.map(sub => ({
            ...sub,
            statusClass: this.getStatusClass(sub.status),
            statusText: this.getStatusText(sub.status)
          }));

          // 计算总正确率
          const totalCorrect = submissions.filter(s => s.is_correct).length;
          const avgAccuracy = submissions.length > 0 ? (totalCorrect / submissions.length * 100) : 0;

          this.setData({
            submissionData: {
              totalCount: res.data.total_count || submissions.length,
              avgAccuracy: avgAccuracy,
              avgAccuracy_formatted: this.formatProbability(avgAccuracy),
              submissions: processedSubmissions
            },
            currentPage: 1,
            hasMore: res.data.has_more || false,
            empty: submissions.length === 0,
            loading: false
          });
        } else {
          this.setData({ empty: true, loading: false });
        }
      },
      fail: (err) => {
        console.error("获取做题记录失败", err);
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        this.setData({ empty: true, loading: false });
      },
      complete: () => {
        if (callback) callback();
      }
    });
  },

  loadMoreSubmissions() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }

    this.setData({ loadingMore: true });

    const token = wx.getStorageSync('accessToken');
    const nextPage = this.data.currentPage + 1;

    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      data: {
        page: nextPage,
        limit: this.data.pageSize,
        sort_by: 'submitted_time:desc'
      },
      success: (res) => {
        if (res.data.data) {
          const newSubmissions = (res.data.data || []).map(item => {
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

          // 预处理状态样式和文本
          const processedNewSubmissions = newSubmissions.map(sub => ({
            ...sub,
            statusClass: this.getStatusClass(sub.status),
            statusText: this.getStatusText(sub.status)
          }));

          // 追加到现有列表
          const currentSubmissions = this.data.submissionData.submissions;
          const updatedSubmissions = [...currentSubmissions, ...processedNewSubmissions];

          // 重新计算总正确率
          const totalCorrect = updatedSubmissions.filter(s => s.is_correct).length;
          const avgAccuracy = updatedSubmissions.length > 0 ? (totalCorrect / updatedSubmissions.length * 100) : 0;

          this.setData({
            submissionData: {
              ...this.data.submissionData,
              avgAccuracy: avgAccuracy,
              avgAccuracy_formatted: this.formatProbability(avgAccuracy),
              submissions: updatedSubmissions
            },
            currentPage: nextPage,
            hasMore: res.data.has_more || false,
            loadingMore: false
          });
        }
      },
      fail: (err) => {
        console.error("加载更多失败", err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loadingMore: false });
      }
    });
  },

  formatProbability(value) {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0';
    }
    return value.toFixed(1);
  },

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
