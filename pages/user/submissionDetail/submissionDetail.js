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
        if(res.statusCode == 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          console.log('收到了submission数据：', res.data);
          
          const rawData = res.data;
          
          // 1. 根据 problem_type 决定显示哪个答案字段
          const finalUserAnswer = this.determineUserAnswer(rawData);

          // 2. 处理数据
          const processedData = {
            ...rawData,
            // 兼容不同字段名
            question_title: rawData.question_title || rawData.problem_title || '未知题目',
            created_at: rawData.created_at || rawData.submitted_time || '',
            
            // 状态处理
            statusClass: this.getStatusClass(rawData.status),
            statusText: this.getStatusText(rawData.status),
            
            // 核心修改：根据题型确定的答案
            user_answer: finalUserAnswer,
            
            // 确保 is_correct 存在
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

  // 新增：根据题型决定显示的答案内容
  determineUserAnswer(data) {
    const type = (data.problem_type || '').toLowerCase(); // 获取题型并转小写方便匹配
    const chooseAnswer = data.choose_answer;
    const textAnswer = data.submitted_text;

    // 逻辑：如果是选择类题型，优先取 choose_answer
    // 假设后端返回的类型名称包含这些关键词
    const isChoiceType = 
      type.includes('choice') || 
      type.includes('select') || 
      type.includes('选择') || 
      type.includes('多选');

    if (isChoiceType) {
      // 如果是选择题，返回选项（如果为空则回退到文本）
      return chooseAnswer || textAnswer || '';
    } else {
      // 如果是问答、填空、编程等，优先取文本（如果为空则回退到选项）
      return textAnswer || chooseAnswer || '';
    }
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
    return textMap[status] || status;
  },

  // 复制用户答案
  copyAnswer() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.user_answer) {
      wx.setClipboardData({
        data: submissionDetail.user_answer.toString(), // 确保是字符串
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