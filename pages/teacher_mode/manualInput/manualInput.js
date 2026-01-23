// pages/teacherHomeworkPage/manualInput/manualInput.js
Page({

  /*** 页面的初始数据*/
  data: {
    title: '',
    content: '',
    problemTypeIndex: -1,
    subjectIndex: -1,
    difficulty: -1, // 默认中等难度
    selectedTags: [],
    estimatedTime: 5,
    points: 10,
    answer: '',
    explanation: '',
    attachments: [],
    problemTypes: [],
    subjects: [],
    tags: [],
    userInfo:{}
    },
  onLoad: function (options) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    console.log('获取到参数：',options);
    this.setData({
      class_id:options.class_id,
    });
    // 如果有传递的作业ID，说明是编辑模式
      wx.request({
        url: `${app.globalData.globalUrl}/assignment/wx/get_problem_meta_data/`,
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
          if(res.statusCode == 200){
            console.log("收到后端发来的信息：",res.data);
            this.setData({
              problemTypes:res.data.data.problemTypes,
              subjects:res.data.data.subjects,
              tags:res.data.data.tags,
            });
          }
        } 
      })

  },
  /*** 加载题目数据（编辑模式）*/
  loadProblemData: function(id) {
    // 模拟从服务器加载数据
    wx.showLoading({
      title: '加载中...',
    });
    // 这里应该是实际的API调用
    setTimeout(() => {
      const mockData = {
        title: '二次函数基础练习题',
        content: '已知二次函数 f(x) = ax² + bx + c，当 x=1 时，f(x)有最小值...',
        problemTypeIndex: 0,
        subjectIndex: 0,
        difficulty: 1,
        selectedTags: [1, 2],
        estimatedTime: 8,
        points: 15,
        answer: 'x=1',
        explanation: '根据二次函数的性质，当x=-b/2a时取得最值...',
        attachments: ['函数图像.png']
      };
      
      this.setData(mockData);
      wx.hideLoading();
    }, 1000);
  },

  /*** 输入题目标题*/
  onTitleInput: function(e) {
    this.setData({
      title: e.detail.value
    });
  },

  /*** 输入题目内容*/
  onContentInput: function(e) {
    this.setData({
      content: e.detail.value
    });
  },

  /*** 选择题目类型*/
  onProblemTypeChange: function(e) {
    this.setData({
      problemTypeIndex: parseInt(e.detail.value)
    });
  },

  /*** 选择所属科目*/
  onSubjectChange: function(e) {
    this.setData({
      subjectIndex: parseInt(e.detail.value)
    });
  },

  /*** 选择难度*/
  onDifficultyChange: function(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    this.setData({
      difficulty: level
    });
  },

  /*** 切换标签选择*/
  onTagToggle: function(e) {
    const tagId = e.currentTarget.dataset.tag.id;
    const selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(tagId);
    
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(tagId);
    }
    
    this.setData({
      selectedTags: selectedTags
    });
  },

  /*** 输入预估时间*/
  onTimeInput: function(e) {
    this.setData({
      estimatedTime: parseInt(e.detail.value) || 0
    });
  },

  /*** 输入分值*/
  onPointsInput: function(e) {
    this.setData({
      points: parseInt(e.detail.value) || 0
    });
  },

  /*** 输入答案*/
  onAnswerInput: function(e) {
    this.setData({
      answer: e.detail.value
    });
  },

  /*** 输入答案解析*/
  onExplanationInput: function(e) {
    this.setData({
      explanation: e.detail.value
    });
  },

  /*** 上传附件*/
  onUploadAttachment: function() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const tempFiles = res.tempFiles;
        if (tempFiles && tempFiles.length > 0) {
          const fileName = tempFiles[0].name;
          const attachments = [...this.data.attachments, fileName];
          this.setData({
            attachments: attachments
          });
          
          wx.showToast({
            title: '附件已添加',
            icon: 'success'
          });
        }
      }
    });
  },

  /*** 移除附件*/
  onRemoveAttachment: function(e) {
    const index = e.currentTarget.dataset.index;
    const attachments = [...this.data.attachments];
    attachments.splice(index, 1);
    this.setData({
      attachments: attachments
    });
  },

  /*** 验证表单*/
  validateForm: function() {
    const { title, content, problemTypeIndex, subjectIndex } = this.data;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入题目标题',
        icon: 'none'
      });
      return false;
    }
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入题目内容',
        icon: 'none'
      });
      return false;
    }
    
    if (problemTypeIndex < 0) {
      wx.showToast({
        title: '请选择题目类型',
        icon: 'none'
      });
      return false;
    }
    
    if (subjectIndex < 0) {
      wx.showToast({
        title: '请选择所属科目',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  /*** 保存草稿*/
  onSaveDraft: function() {
    if (!this.validateForm()) return;
    const formData = this.collectFormData();
    formData.status = 'draft';
    this.submitProblem(formData, '草稿保存成功');
  },
  /*** 提交题目*/
  onSubmit: function() {
    if (!this.validateForm()) return;
    const formData = this.collectFormData();
    formData.status = 'published';
    this.submitProblem(formData, '题目提交成功');
  },
  /*** 收集表单数据*/
  collectFormData: function() {
    const { 
      title, content, problemTypeIndex, subjectIndex, difficulty, 
      selectedTags, estimatedTime, points, answer, explanation, attachments 
    } = this.data;
    return {
      title: title.trim(),
      content: content.trim(),
      problem_type: this.data.problemTypes[problemTypeIndex].id,
      subject: this.data.subjects[subjectIndex].id,
      difficulty: difficulty,
      tags: selectedTags,
      estimated_time: estimatedTime,
      points: points,
      answer: answer.trim(),
      explanation: explanation.trim(),
      attachments: attachments,
      class_id:this.data.class_id,
    };
  },
  /*** 提交题目到服务器*/
  submitProblem: function(formData, successMessage) {
    wx.showLoading({
      title: '提交中...',
    });
    const app = getApp();
    const token  = wx.getStorageSync('accessToken');
    // 这里应该是实际的API调用
    console.log("提交给后端的题目数据是：",formData);
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/push_assignment/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: formData,
      success: (res) => {
        if(res.statusCode == 401){
          app.handleTokenExpired();
          return;
        }
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: successMessage,
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: successMessage,
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 2000);
  },
  /*** 取消操作*/
  onCancel: function() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消输入吗？所有未保存的内容将会丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },
})