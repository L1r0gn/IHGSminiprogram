// pages/teacher_mode/editHomework/editHomework.js
const app = getApp();

Page({
  data: {
    isEditMode: false,           // 是否为编辑模式
    homeworkId: '',
    classId: '',
    // 表单数据
    formData: {
      title: '',
      description: '',
      content: '',
      problem_type: '',
      subject: '',
      difficulty: 3,
      knowledge_points: [],
      points: 10,
      answer: '',
      explanation: ''
    },
    date: '',
    time: '',
    today: new Date().toISOString().split('T')[0],
    // 元数据选项
    problemTypes: [],
    subjects: [],
    knowledgePoints: [],
    tags: [],
    // 选中的知识点（完整对象数组）
    selectedKnowledgePoints: [],
    // 搜索关键词
    searchKeyword: '',
    // 过滤后的知识点列表
    filteredKnowledgePoints: [],
    // 是否显示知识点列表
    showKnowledgeList: false,
    // 难度选项
    difficultyOptions: [
      { value: 1, label: '简单' },
      { value: 2, label: '较易' },
      { value: 3, label: '中等' },
      { value: 4, label: '较难' },
      { value: 5, label: '困难' }
    ],
    // 分数选项
    pointOptions: [5, 10, 15, 20, 25, 30],
    // Picker 的选中索引
    problemTypeIndex: 0,
    subjectIndex: 0,
    difficultyIndex: 2,
    pointsIndex: 1
  },

  onLoad(options) {
    // 判断是新建还是编辑
    if (options.homework_id) {
      this.setData({
        isEditMode: true,
        homeworkId: options.homework_id,
        classId: options.class_id
      });
      this.fetchHomeworkDetail();
    } else if (options.class_id) {
      // 新建模式
      this.setData({
        isEditMode: false,
        classId: options.class_id
      });
    }

    // 获取元数据
    this.fetchProblemMetadata();
  },

  // 获取题目元数据
  fetchProblemMetadata() {
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/get_problem_meta_data/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const data = res.data.data;
          this.setData({
            problemTypes: data.problemTypes || [],
            subjects: data.subjects || [],
            knowledgePoints: data.knowledgePoints || [],
            tags: data.tags || []
          });

          // 设置默认值（仅新建模式）
          if (!this.data.isEditMode && data.subjects?.length > 0) {
            this.setData({
              'formData.subject': data.subjects[0].id,
              subjectIndex: 0
            });
          }
          if (!this.data.isEditMode && data.problemTypes?.length > 0) {
            this.setData({
              'formData.problem_type': data.problemTypes[0].id,
              problemTypeIndex: 0
            });
          }
        }
      },
      fail: () => {
        wx.showToast({ title: '获取元数据失败', icon: 'none' });
      }
    });
  },

  // 获取作业详情（编辑模式）
  fetchHomeworkDetail() {
    const token = wx.getStorageSync('accessToken');
    const url = `${app.globalData.globalUrl}/assignment/wx/teacher_get_assignments_detail/${this.data.classId}/${this.data.homeworkId}/`;

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: url,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const data = res.data.data;

          // 处理截止时间
          let date = '', time = '';
          if (data.deadline) {
            const parts = data.deadline.split(' ');
            if (parts.length === 2) {
              date = parts[0];
              time = parts[1].substring(0, 5);
            }
          }

          // 找到对应的索引
          const subjectIndex = this.data.subjects.findIndex(s => s.id === data.subject);
          const problemTypeIndex = this.data.problemTypes.findIndex(t => t.id === data.problem_type);
          const difficultyIndex = this.data.difficultyOptions.findIndex(d => d.value === data.difficulty);
          const pointsIndex = this.data.pointOptions.findIndex(p => p === data.points);

          // 处理选中的知识点
          const knowledgePointIds = data.knowledge_points || [];
          const selectedKnowledgePoints = this.data.knowledgePoints.filter(kp =>
            knowledgePointIds.includes(kp.id)
          );

          this.setData({
            formData: {
              title: data.title || '',
              description: data.description || '',
              content: data.content || '',
              problem_type: data.problem_type || '',
              subject: data.subject || '',
              difficulty: data.difficulty || 3,
              knowledge_points: knowledgePointIds,
              points: data.points || 10,
              answer: data.answer || '',
              explanation: data.explanation || ''
            },
            selectedKnowledgePoints: selectedKnowledgePoints,
            date: date,
            time: time,
            subjectIndex: subjectIndex >= 0 ? subjectIndex : 0,
            problemTypeIndex: problemTypeIndex >= 0 ? problemTypeIndex : 0,
            difficultyIndex: difficultyIndex >= 0 ? difficultyIndex : 2,
            pointsIndex: pointsIndex >= 0 ? pointsIndex : 1
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 监听输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 监听日期变化
  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  // 监听时间变化
  onTimeChange(e) {
    this.setData({ time: e.detail.value });
  },

  // 监听题目类型变化
  onProblemTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      problemTypeIndex: index,
      'formData.problem_type': this.data.problemTypes[index].id
    });
  },

  // 监听科目变化
  onSubjectChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      subjectIndex: index,
      'formData.subject': this.data.subjects[index].id
    });
  },

  // 监听难度变化
  onDifficultyChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      difficultyIndex: index,
      'formData.difficulty': this.data.difficultyOptions[index].value
    });
  },

  // 监听分数变化
  onPointsChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      pointsIndex: index,
      'formData.points': this.data.pointOptions[index]
    });
  },

  // 切换知识点选择
  toggleKnowledgePoint(e) {
    const index = e.currentTarget.dataset.index;
    const point = this.data.knowledgePoints[index];
    const selectedKnowledgeIndexes = [...this.data.selectedKnowledgeIndexes];

    const existingIndex = selectedKnowledgeIndexes.indexOf(index);
    if (existingIndex > -1) {
      selectedKnowledgeIndexes.splice(existingIndex, 1);
    } else {
      selectedKnowledgeIndexes.push(index);
    }

    // 更新选中的知识点ID列表
    const knowledge_points = selectedKnowledgeIndexes.map(idx => this.data.knowledgePoints[idx].id);

    this.setData({
      selectedKnowledgeIndexes,
      'formData.knowledge_points': knowledge_points
    });
  },

  // 显示知识点列表
  showKnowledgeList() {
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    let filteredPoints = this.data.knowledgePoints;

    if (keyword) {
      filteredPoints = this.data.knowledgePoints.filter(item =>
        item.name.toLowerCase().includes(keyword)
      );
    } else {
      // 无关键词时显示所有知识点
      filteredPoints = this.data.knowledgePoints;
    }

    this.setData({
      filteredKnowledgePoints: filteredPoints,
      showKnowledgeList: true
    });
  },

  // 搜索知识点输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 添加知识点
  addKnowledgePoint(e) {
    const id = e.currentTarget.dataset.id;
    const item = e.currentTarget.dataset.item;
    const currentIds = this.data.formData.knowledge_points;

    // 检查是否已添加
    if (currentIds.includes(id)) {
      wx.showToast({ title: '该知识点已选择', icon: 'none' });
      return;
    }

    const newSelectedPoints = [...this.data.selectedKnowledgePoints, item];
    const newIds = newSelectedPoints.map(p => p.id);

    this.setData({
      selectedKnowledgePoints: newSelectedPoints,
      'formData.knowledge_points': newIds,
      searchKeyword: '',
      showKnowledgeList: false,
      filteredKnowledgePoints: []
    });
  },

  // 移除知识点
  removeKnowledgePoint(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const newSelectedPoints = this.data.selectedKnowledgePoints.filter(p => p.id !== id);
    const newIds = newSelectedPoints.map(p => p.id);

    this.setData({
      selectedKnowledgePoints: newSelectedPoints,
      'formData.knowledge_points': newIds
    });
  },

  // 提交作业
  submitHomework() {
    const { formData, date, time } = this.data;

    // 校验必填项
    if (!formData.title.trim()) {
      return wx.showToast({ title: '请输入作业标题', icon: 'none' });
    }
    if (!date || !time) {
      return wx.showToast({ title: '请选择截止时间', icon: 'none' });
    }
    if (!formData.problem_type) {
      return wx.showToast({ title: '请选择题目类型', icon: 'none' });
    }
    if (!formData.subject) {
      return wx.showToast({ title: '请选择科目', icon: 'none' });
    }
    if (formData.knowledge_points.length === 0) {
      return wx.showToast({ title: '请至少选择一个知识点', icon: 'none' });
    }
    if (!formData.content.trim()) {
      return wx.showToast({ title: '请输入题目内容', icon: 'none' });
    }
    if (!formData.answer.trim()) {
      return wx.showToast({ title: '请输入正确答案', icon: 'none' });
    }

    const fullDeadline = `${date} ${time}:59`;

    wx.showLoading({ title: this.data.isEditMode ? '保存中...' : '发布中...' });

    const requestData = {
      class_id: this.data.classId,
      title: formData.title,
      description: formData.description,
      deadline: fullDeadline,
      content: formData.content,
      problem_type: formData.problem_type,
      subject: formData.subject,
      difficulty: formData.difficulty,
      knowledge_points: formData.knowledge_points,
      points: formData.points,
      answer: formData.answer,
      explanation: formData.explanation
    };

    // 根据模式选择不同的接口
    const url = this.data.isEditMode
      ? `${app.globalData.globalUrl}/assignment/wx/update_assignment/${this.data.homeworkId}/`
      : `${app.globalData.globalUrl}/assignment/wx/push_assignment/`;

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: this.data.isEditMode ? '修改成功' : '发布成功',
            icon: 'success'
          });

          setTimeout(() => {
            // 刷新上一页数据
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage) {
              if (prevPage.fetchHomeworkList) {
                prevPage.fetchHomeworkList();
              } else if (prevPage.getHomeworkDetail) {
                prevPage.getHomeworkDetail(this.data.homeworkId);
              }
            }
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  }
});