const katexLib = require('../../miniprogram_npm/@rojer/katex-mini/index.js');
const app = getApp();

Page({
  data: {
    assignmentId: null,
    mode: 'view', // view: 查看作业, do: 做题, grade: 查看成绩
    isLoading: true,

    homeworkDetail: {},
    resolvedProblemContent: '',
    // 选择题相关
    options: [
      { id: 'A', selected: false },
      { id: 'B', selected: false },
      { id: 'C', selected: false },
      { id: 'D', selected: false }
    ],
    selectedAnswer: '',
    // 图片题相关
    submitted_image_path: '',
    // 主观题相关
    studentAnswerContent: '',
    // 批改相关
    submissionDetail: null,
    score: null,
    feedback: '',
    // 作业状态
    isOverdue: false,
    statusText: '',
    statusClass: ''
  },

  onLoad: function (options) {
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        duration: 2000,
        complete: () => wx.navigateBack()
      });
      return;
    }
    this.setData({
      assignmentId: options.id,
      mode: options.mode || 'view'
    });

    this.loadData();
  },

  loadData: function () {
    const { mode, assignmentId } = this.data;

    if (mode === 'do') {
      this.loadHomeworkDetail();
    } else if (mode === 'grade') {
      this.loadSubmissionDetail();
    } else {
      this.loadHomeworkDetail();
    }
  },

  loadHomeworkDetail: function () {
    const token = wx.getStorageSync('accessToken');
    if (!token) {
      app.handleTokenExpired();
      return;
    }

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/get_student_homework_detail/${this.data.assignmentId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const detail = res.data.data;

          let isOverdue = false;
          if (detail.deadline) {
            const deadlineDate = new Date(detail.deadline.replace(/-/g, '/'));
            if (deadlineDate < new Date()) {
              isOverdue = true;
            }
          }

          const resolvedProblemContent = this.parseLatexContent(detail.problem_content);
          const statusInfo = this.formatStatus(detail, isOverdue);

          this.setData({
            homeworkDetail: detail,
            isOverdue: isOverdue,
            isLoading: false,
            resolvedProblemContent: resolvedProblemContent,
            score: detail.score || null,
            feedback: detail.feedback || '',
            statusText: statusInfo.text,
            statusClass: statusInfo.class
          });

          if (detail.student_answer_content) {
            this.populateStudentAnswer(detail);
          }
        } else if (res.statusCode === 401) {
          app.handleTokenExpired();
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  loadSubmissionDetail: function () {
    const token = wx.getStorageSync('accessToken');

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/assignment_id=${this.data.assignmentId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data && res.data.length > 0) {
          const submission = res.data[0];

          this.setData({
            submissionDetail: submission,
            homeworkDetail: {
              title: submission.assignment_title || '作业详情',
              problem_content: submission.question_content || '',
              problem_type: submission.question_type || '',
              deadline: submission.deadline || ''
            },
            resolvedProblemContent: this.parseLatexContent(submission.question_content || ''),
            isLoading: false,
            score: submission.score || 0,
            feedback: submission.feedback || '',
            statusText: '已批改',
            statusClass: 'graded'
          });

          if (submission.submitted_answer) {
            this.populateAnswerFromSubmission(submission);
          }

          if (submission.submitted_image) {
            this.setData({
              submitted_image_path: submission.submitted_image
            });
          }
        } else {
          wx.showToast({
            title: '暂无提交记录',
            icon: 'none'
          });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  formatStatus: function (detail, isOverdue) {
    let text = '';
    let cls = '';

    switch (detail.status) {
      case 'PENDING':
        text = isOverdue ? '已截止' : '待完成';
        cls = isOverdue ? 'overdue' : 'pending';
        break;
      case 'SUBMITTED':
        text = '已提交';
        cls = 'submitted';
        break;
      case 'GRADED':
        text = '已批改';
        cls = 'graded';
        break;
      case 'ACCEPTED':
        text = '已完成';
        cls = 'accepted';
        break;
      case 'WRONG_ANSWER':
        text = '需修改';
        cls = 'wrong';
        break;
      default:
        text = detail.status || '未知';
        cls = 'default';
    }

    return { text, class: cls };
  },

  populateStudentAnswer: function (detail) {
    const type = detail.problem_type;
    const answer = detail.choose_answer || detail.student_answer_content || '';

    if (!answer) return;

    if (type === '选择') {
      const newOptions = this.data.options.map(opt => ({
        ...opt,
        selected: opt.id === answer
      }));
      this.setData({
        options: newOptions,
        selectedAnswer: answer
      });
    } else if (type === '图片' || type === '拍照') {
      this.setData({
        submitted_image_path: answer
      });
    } else if (type === '主观' || type === '简答' || type === '填空') {
      this.setData({
        studentAnswerContent: answer
      });
    }
  },

  populateAnswerFromSubmission: function (submission) {
    const type = submission.question_type || '';
    const answer = submission.submitted_answer || submission.choose_answer || '';

    if (!answer) return;

    if (type === '选择') {
      const newOptions = this.data.options.map(opt => ({
        ...opt,
        selected: opt.id === answer
      }));
      this.setData({
        options: newOptions,
        selectedAnswer: answer
      });
    } else if (type === '主观' || type === '简答' || type === '填空') {
      this.setData({
        studentAnswerContent: answer
      });
    }
  },

  selectAnswer: function (e) {
    if (this.data.mode !== 'do') return;

    const selectedAnswer = e.currentTarget.dataset.id;
    const updatedOptions = this.data.options.map(option => ({
      ...option,
      selected: option.id === selectedAnswer
    }));

    this.setData({
      selectedAnswer: selectedAnswer,
      options: updatedOptions
    });
  },

  uploadImage: function () {
    if (this.data.mode !== 'do') return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        this.setData({
          submitted_image_path: res.tempFiles[0].tempFilePath
        });
      }
    });
  },

  onSubmit: function () {
    const { homeworkDetail, isOverdue, mode } = this.data;

    if (mode !== 'do') return;

    if (isOverdue) {
      wx.showToast({
        title: '已超过截止时间，无法提交',
        icon: 'none'
      });
      return;
    }

    if (homeworkDetail.status !== 'PENDING') {
      wx.showToast({
        title: '作业已提交，无法重复提交',
        icon: 'none'
      });
      return;
    }

    const type = this.data.homeworkDetail.problem_type;
    let isValid = false;
    let errorMsg = '答案不能为空';

    if (type === '选择') {
      if (this.data.selectedAnswer) {
        isValid = true;
      }
      errorMsg = '请选择一个选项';
    } else if (type === '简答' || type === '填空') {
      if (this.data.submitted_image_path) {
        isValid = true;
      }
      errorMsg = '请上传图片';
    }

    if (!isValid) {
      wx.showToast({
        title: errorMsg,
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认提交',
      content: '提交后将无法修改，确定要提交吗？',
      success: (res) => {
        if (res.confirm) {
          this.performSubmit();
        }
      }
    });
  },

  performSubmit: function () {
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');

    if (!token || !userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const type = this.data.homeworkDetail.problem_type;

    if (type === '选择') {
      this.submitChoiceAnswer(token, userId);
    } else if (type === '简答' || type === '填空') {
      this.submitImageAnswer(token, userId);
    }
  },

  submitChoiceAnswer: function (token, userId) {
    // 参数验证
    if (!token || !userId) {
      wx.showToast({
        title: '登录信息无效，请重新登录',
        icon: 'none'
      });
      return;
    }

    // 数据验证
    if (!this.data.homeworkDetail.problem_id || !this.data.selectedAnswer) {
      wx.showToast({
        title: '请先选择答案',
        icon: 'none'
      });
      return;
    }

    const postData = {
      questionId: this.data.homeworkDetail.problem_id,
      selectedAnswer: this.data.selectedAnswer,
      userId: userId,
    };

    wx.showLoading({ title: '提交中...' });
    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submit/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
      },
      data: {
        from: 'assignment',
        assignment_id: this.data.homeworkDetail.assignment_id,
        ...postData
      },
      success: (res) => {
        try {
          wx.hideLoading();
          if (res.statusCode === 200 ) {
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            this.submitBackTimer = setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else if (res.statusCode === 401) {
            app.handleTokenExpired();
          } else {
            const errorMsg = (res.data && res.data.error) || '提交失败';
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('处理提交结果失败:', error);
          wx.showToast({
            title: '提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交答案失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  submitImageAnswer: function (token, userId) {
    if (!this.data.submitted_image_path) {
      wx.showToast({ title: '请先上传答案图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    wx.uploadFile({
      url: `${app.globalData.globalUrl}/grading/wx/submit/`,
      filePath: this.data.submitted_image_path,
      name: 'submitted_image',
      header: { 'Authorization': `Bearer ${token}` },
      formData: {
        questionId: this.data.homeworkDetail.problem_id,
        userId: userId,
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const parsedData = JSON.parse(res.data);
          if (res.statusCode === 200) {
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({
              title: parsedData.error || '提交失败',
              icon: 'none'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '服务器返回格式错误',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  previewImage: function () {
    if (this.data.submitted_image_path) {
      wx.previewImage({
        urls: [this.data.submitted_image_path]
      });
    }
  },

  parseLatexContent: function (content) {
    if (!content) return content;

    try {
      const result = katexLib.renderMathInText(content, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });

      return Array.isArray(result) ? result : content;
    } catch (error) {
      console.error('LaTeX解析失败:', error);
      return content;
    }
  },

  onPullDownRefresh: function () {
    this.loadData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onUnload: function () {
    // 清理定时器，避免内存泄漏
    if (this.submitBackTimer) {
      clearTimeout(this.submitBackTimer);
      this.submitBackTimer = null;
    }
  }
});
