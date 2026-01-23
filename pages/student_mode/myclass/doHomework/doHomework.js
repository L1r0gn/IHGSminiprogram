// pages/myclass/doHomework/doHomework.js
const app = getApp();

Page({
  data: {
    assignmentId: null,
    assignmentStatusId: null,
    isLoading: true,
    isOverdue: false,
    isRedo: false, // 新增：是否为重做模式
    homeworkDetail: {},
    studentAnswerContent: '',
    // 选择题相关
    options: [{ id: 'A', selected: false },
              { id: 'B', selected: false },
              { id: 'C', selected: false },
              { id: 'D', selected: false }],
    selectedAnswer: '',
    // 图片题相关
    SUBMITTED_image_path: '',
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
    
    const isRedo = options.redo === 'true';
    
    this.setData({
      assignmentId: options.id,
      isRedo: isRedo
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

          this.setData({
            homeworkDetail: detail,
            assignmentStatusId: detail.assignment_status_id,
            isOverdue: isOverdue,
            isLoading: false,
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
        SUBMITTED_image_path: answer
      });
    } else if (type === '主观' || type === '简答' || type === '填空') {
      this.setData({
        studentAnswerContent: answer
      });
    }
  },

  /* 检查是否可以重做*/
  canRedo: function() {
    const { homeworkDetail, isRedo, isOverdue } = this.data;
    // 如果不是重做模式，按正常逻辑处理
    if (!isRedo) {
      if (isOverdue) {
        return { canRedo: false, reason: '已超过截止时间，无法提交' };
      }
      if (homeworkDetail.status !== 'PENDING') {
        return { canRedo: false, reason: '作业已提交，无法重复提交' };
      }
      return { canRedo: true };
    }
    
    // 重做模式的特殊逻辑
    if (isOverdue) {
      return { canRedo: false, reason: '已超过截止时间，无法重做' };
    }
    // 检查是否允许重做（可以根据业务需求调整条件）
    if (homeworkDetail.status == 'GRADED'||'SUBMITTED'||'ACCEPT'||'WRONG_ANSWER') {
      return { canRedo: true };
    }
    return { canRedo: false, reason: '当前状态不允许重做' };
  },

  /* 提交作业 (校验)*/
  onSubmit: function () {
    const checkResult = this.canRedo();
    if (!checkResult.canRedo) {
      wx.showToast({
        title: checkResult.reason,
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
    } else if (type === '图片' || type === '拍照') {
      if (this.data.SUBMITTED_image_path) {
        isValid = true;
      }
      errorMsg = '请上传图片';
    } else if (type === '主观' || type === '简答' || type === '填空') {
      if (this.data.studentAnswerContent.trim() !== '') {
        isValid = true;
      }
      errorMsg = '答案不能为空';
    }

    if (!isValid) {
      wx.showToast({
        title: errorMsg,
        icon: 'none'
      });
      return;
    }

    // 根据是否为重做模式显示不同的提示
    const modalTitle = this.data.isRedo ? '确认重做提交' : '确认提交';
    const modalContent = this.data.isRedo ? 
      '确定要重新提交作业吗？这将覆盖之前的答案。' : 
      '提交后将无法修改，确定要提交吗？';

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
    if (!token) {
      app.handleTokenExpired();
      return;
    }

    // 根据题目类型准备答案数据
    const type = this.data.homeworkDetail.problem_type;
    let answerData = {};
    
    if (type === '选择') {
      answerData = { answer_content: this.data.selectedAnswer };
    } else if (type === '图片' || type === '拍照') {
      answerData = { answer_content: this.data.SUBMITTED_image_path };
    } else if (type === '主观' || type === '简答' || type === '填空') {
      answerData = { answer_content: this.data.studentAnswerContent };
    }

    // 如果是重做模式，添加重做标识
    if (this.data.isRedo) {
      answerData.is_redo = true;
    }

    wx.showLoading({ title: '提交中...' });
    
    console.log('提交的答案数据为：', answerData);
    
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/homeworkGradingProcess/${this.data.assignmentId}/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: answerData,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          const successMessage = this.data.isRedo ? '重做提交成功' : '提交成功';
          wx.showToast({
            title: successMessage,
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
  },

  /* 清空答案（重做时使用）*/
  clearAnswer: function() {
    wx.showModal({
      title: '清空答案',
      content: '确定要清空当前答案吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            studentAnswerContent: '',
            selectedAnswer: '',
            options: this.data.options.map(opt => ({ ...opt, selected: false })),
            SUBMITTED_image_path: ''
          });
          wx.showToast({
            title: '答案已清空',
            icon: 'success'
          });
        }
      }
    });
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
  }
});