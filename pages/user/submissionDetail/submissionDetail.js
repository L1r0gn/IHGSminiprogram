// pages/submission-detail/submission-detail.js
Page({
  data: {
    submissionId: null,
    submissionDetail: null,
    loading: true,
    error: null
  },

  onLoad(options) {
    const { submissionId } = options;
    if (submissionId) {
      this.setData({ submissionId });
      this.fetchSubmissionDetail(submissionId);
    } else {
      this.setData({
        loading: false,
        error: '缺少提交记录ID'
      });
    }
  },

  // 获取提交记录详情
  fetchSubmissionDetail(submissionId) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    this.setData({ loading: true, error: null });
    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/${submissionId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if(res.statusCode == 401)
        {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          console.log('收到了submission数据：',res.data);
          
          const rawData = res.data;
          // 处理数据，添加显示用的属性
          const processedData = {
            ...rawData,
            // 兼容不同字段名
            question_title: rawData.question_title || rawData.problem_title || '未知题目',
            created_at: rawData.created_at || rawData.submitted_time || '',
            statusClass: this.getStatusClass(rawData.status),
            statusText: this.getStatusText(rawData.status),
            // 确保 user_answer 存在
            user_answer: rawData.user_answer || '',
            // 确保 is_correct 存在 (如果后端没返回，根据 status 判断)
            is_correct: rawData.is_correct !== undefined ? rawData.is_correct : (rawData.status === 'ACCEPTED' || rawData.status === 'GRADED')
          };

          this.setData({
            submissionDetail: processedData,
            loading: false
          });
        } else {
          this.setData({
            loading: false,
            error: res.data.error || '获取详情失败'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        this.setData({
          loading: false,
          error: '网络请求失败，请检查网络连接'
        });
      }
    });
  },

  // 状态分类函数
  getStatusClass(status) {
    const statusMap = {
      'GRADED': 'correct',
      'ACCEPTED': 'correct',
      'RUNTIME_ERROR': 'incorrect',
      'WRONG_ANSWER': 'incorrect',
      'PENDING': 'pending'
    };
    return statusMap[status] || 'pending';
  },

  // 状态文本显示函数
  getStatusText(status) {
    const textMap = {
      'GRADED': '已评分',
      'ACCEPTED': '已通过',
      'RUNTIME_ERROR': '运行错误',
      'WRONG_ANSWER': '答案错误',
      'PENDING': '待批改'
    };
    return textMap[status] || status; // 如果没有匹配，显示原状态
  },

  // 复制用户答案
  copyAnswer() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.user_answer) {
      wx.setClipboardData({
        data: submissionDetail.user_answer,
        success: () => {
          wx.showToast({
            title: '答案已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 重新加载
  onRetry() {
    if (this.data.submissionId) {
      this.fetchSubmissionDetail(this.data.submissionId);
    }
  },
  // 预览图片
  previewImage() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.submitted_image) {
      wx.previewImage({
        urls: [submissionDetail.submitted_image],
        current: submissionDetail.submitted_image
      });
    }
  },

  // 复制反馈信息
  copyFeedback() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.feedback) {
      wx.setClipboardData({
        data: submissionDetail.feedback,
        success: () => {
          wx.showToast({
            title: '反馈已复制',
            icon: 'success'
          });
        }
      });
    }
  }
})