// pages/myclass/doHomework/doHomework.js
const katexLib = require('../../../../miniprogram_npm/@rojer/katex-mini/index.js');
const katex = katexLib.default;
const app = getApp();

Page({
  data: {
    assignmentId: null,
    assignmentStatusId: null,
    isLoading: true,
    isOverdue: false,

    homeworkDetail: {},
    resolvedProblemContent: '', // 解析后的题目内容
    studentAnswerContent: '',
    // 选择题相关
    options: [{ id: 'A', selected: false },
              { id: 'B', selected: false },
              { id: 'C', selected: false },
              { id: 'D', selected: false }],
    selectedAnswer: '',
    // 图片题相关
    submitted_image_path: '',
    // 显示历史分数和反馈
    previousScore: null,
    previousFeedback: '',
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
      assignmentId: options.id
    });
    
    this.loadHomeworkDetail();
  },

  /* 加载作业和题目详情*/
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
          console.log('收到题目数据:', detail);

          // 计算是否截止
          let isOverdue = false;
          if (detail.deadline) {
            const deadlineDate = new Date(detail.deadline.replace(/-/g, '/'));
            if (deadlineDate < new Date()) {
              isOverdue = true;
            }
          }
          
          // 解析题目内容中的LaTeX公式
          const resolvedProblemContent = this.parseLatexContent(detail.problem_content);

          this.setData({
            homeworkDetail: detail,
            assignmentStatusId: detail.assignment_status_id,
            isOverdue: isOverdue,
            isLoading: false,
            resolvedProblemContent: resolvedProblemContent,
            // 保存历史分数和反馈
            previousScore: detail.score || null,
            previousFeedback: detail.feedback || ''
          });
          
          // 回填学生答案
          this.populateStudentAnswer(detail);

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

  /* 回填学生上次保存的答案*/
  populateStudentAnswer: function(detail) {
    const type = detail.problem_type;
    const answer = detail.student_answer_content || '';

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


  /* 提交作业 (校验)*/
  onSubmit: function () {
    const { homeworkDetail, isOverdue } = this.data;
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

    const modalTitle = '确认提交';
    const modalContent = '提交后将无法修改，确定要提交吗？';

    wx.showModal({
      title: modalTitle,
      content: modalContent,
      success: (res) => {
        if (res.confirm) {
          this.performSubmit();
        }
      }
    });
  },

  /* 执行提交*/
  performSubmit: function () {
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    
    if (!token || !userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1500);
      return;
    }

    if (!token) {
      app.handleTokenExpired();
      return;
    }

    // 根据题目类型准备答案数据
    const type = this.data.homeworkDetail.problem_type;
    
    if (type === '选择') {
      // 选择题提交
      const postData = {
        questionId: this.data.homeworkDetail.question_id || this.data.assignmentId, // 优先使用question_id，否则使用assignmentId
        selectedAnswer: this.data.selectedAnswer,
        userId: userId,
      };
      
      console.log('提交的选择题数据：', postData);
      
      wx.showLoading({ title: '提交中...' });
      
      wx.request({
        url: `${app.globalData.globalUrl}/grading/wx/submit/`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
        },
        data: postData,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.success) {
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else if (res.statusCode === 401) {
            app.handleTokenExpired();
            return;
          } else {
            wx.showToast({
              title: res.data.error || '提交失败',
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
    } else if (type === '简答' || type === '填空') {
      // 主观题提交（图片）
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
          questionId: this.data.homeworkDetail.question_id || this.data.assignmentId, // 优先使用question_id，否则使用assignmentId
          userId: userId,
        },
        success: (res) => {
          wx.hideLoading();
          try {
            const parsedData = JSON.parse(res.data);
            if (res.statusCode === 200 && parsedData.success) {
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
    }
  },


  
  /*返回列表*/
  onBack: function() {
    wx.navigateBack();
  },

  /* 选择答案 */
  selectAnswer: function(e){
    const selectedAnswer = e.currentTarget.dataset.id;
    console.log('选择了答案：',selectedAnswer);
    this.setData({
      selectedAnswer:selectedAnswer,
    })
    const updatedOptions = this.data.options.map(option => ({
      ...option,
      selected: option.id === selectedAnswer
    }));
    this.setData({
      options: updatedOptions
    });
  },
  uploadImage() {
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
    })
  },
  
  // LaTeX公式解析函数
  parseLatexContent(content) {
    if (!content) return content;
    
    // 使用katex-mini的renderMathInText功能来解析文本中的数学公式
    try {
      const result = katexLib.renderMathInText(content, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
      
      // 如果返回的是节点数组，直接返回；否则返回原始内容
      return Array.isArray(result) ? result : content;
    } catch (error) {
      console.error('LaTeX解析失败:', error);
      return content; // 解析失败时返回原始内容
    }
  },
});