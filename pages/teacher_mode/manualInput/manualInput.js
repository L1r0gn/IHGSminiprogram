// pages/teacher_mode/manualInput/manualInput.js
const app = getApp();

Page({
  data: {
    // 基础信息
    title: '',
    classIndex: -1,
    classList: [],
    deadlineDate: '',
    deadlineTime: '',
    today: '',

    // 题目详情
    subjectIndex: -1,
    subjects: [],
    problemTypeIndex: -1,
    problemTypes: [],
    content: '',
    contentImages: [], // 图片URL列表

    // 动态区域
    isChoice: false,
    options: [
      { key: 'A', value: '' },
      { key: 'B', value: '' }
    ],
    answerIndex: -1, // 选择题答案索引
    answer: '', // 非选择题参考答案

    // 其他
    assignmentId: null, // 编辑模式下的ID
  },

  onLoad: function (options) {
    // 设置今天日期
    const today = new Date().toISOString().split('T')[0];
    this.setData({ today });

    // 获取传入参数
    if (options.id) {
      this.setData({ assignmentId: options.id });
      this.loadAssignmentData(options.id);
    }

    // 加载元数据和班级列表
    this.loadMetaData();
    this.loadClassList();
  },

  // 加载元数据（科目、题型等）
  loadMetaData: function () {
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/get_problem_meta_data/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            problemTypes: res.data.data.problemTypes,
            subjects: res.data.data.subjects,
            tags: res.data.data.tags,
          });
        } else {
          wx.showToast({
            title: '加载元数据失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('加载元数据失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 加载班级列表
  loadClassList: function () {
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.data && res.data.data.class_in) {
          this.setData({
            classList: res.data.data.class_in
          });
        }
      }
    });
  },

  // 加载作业详情（编辑模式）
  loadAssignmentData: function (id) {
    // TODO: 实现编辑模式的数据回显，需请求后端获取作业详情
    console.log('Edit mode for assignment:', id);
  },

  // --- 基础信息交互 ---
  onTitleInput: function (e) {
    this.setData({ title: e.detail.value });
  },

  onClassChange: function (e) {
    this.setData({ classIndex: Number(e.detail.value) });
  },

  onDateChange: function (e) {
    this.setData({ deadlineDate: e.detail.value });
  },

  onTimeChange: function (e) {
    this.setData({ deadlineTime: e.detail.value });
  },

  // --- 题目详情交互 ---
  onSubjectChange: function (e) {
    this.setData({ subjectIndex: Number(e.detail.value) });
  },

  onProblemTypeChange: function (e) {
    const index = Number(e.detail.value);
    const type = this.data.problemTypes[index];
    // 假设题型名称包含"选择"或者ID为2表示选择题
    const isChoice = type.name.includes('选择') || type.id === 2;

    this.setData({
      problemTypeIndex: index,
      isChoice: isChoice
    });
  },

  onDifficultyChange: function (e) {
    this.setData({ difficulty: e.detail.value });
  },

  onPointsInput: function (e) {
    this.setData({ points: Number(e.detail.value) });
  },

  onTimeInput: function (e) {
    this.setData({ estimated_time: Number(e.detail.value) });
  },

  onContentInput: function (e) {
    this.setData({ content: e.detail.value });
  },

  // 图片上传
  uploadImage: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadFileToServer(tempFilePath);
      }
    });
  },

  uploadFileToServer: function (filePath) {
    const token = wx.getStorageSync('accessToken');
    wx.showLoading({ title: '上传中...' });

    // 使用新的上传接口
    wx.uploadFile({
      url: `${app.globalData.globalUrl}/grading/wx/upload/image/`,
      filePath: filePath,
      name: 'file',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.success && data.url) {
              const images = [...this.data.contentImages, data.url];
              this.setData({ contentImages: images });
              wx.showToast({ title: '上传成功', icon: 'success' });
            } else {
              wx.showToast({ title: data.error || '上传失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析响应失败', e);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  removeImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.contentImages];
    images.splice(index, 1);
    this.setData({ contentImages: images });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.contentImages
    });
  },

  // --- 动态选项交互 ---
  addOption: function () {
    const options = this.data.options;
    const nextKey = String.fromCharCode(65 + options.length); // A, B, C...
    options.push({ key: nextKey, value: '' });
    this.setData({ options });
  },

  removeOption: function (e) {
    const index = e.currentTarget.dataset.index;
    const options = this.data.options;
    options.splice(index, 1);
    // 重置Keys
    options.forEach((opt, idx) => {
      opt.key = String.fromCharCode(65 + idx);
    });
    this.setData({ options });
  },

  onOptionInput: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const options = this.data.options;
    options[index].value = value;
    this.setData({ options });
  },

  onAnswerChange: function (e) {
    this.setData({ answerIndex: Number(e.detail.value) });
  },

  onAnswerInput: function (e) {
    this.setData({ answer: e.detail.value });
  },

  // --- 提交逻辑 ---
  validateForm: function () {
    const { title, classIndex, deadlineDate, deadlineTime, subjectIndex, problemTypeIndex, content } = this.data;

    // 基础信息验证
    if (!title || title.trim().length === 0) return '请输入作业标题';
    if (title.trim().length > 100) return '作业标题不能超过100个字符';

    if (classIndex < 0) return '请选择目标班级';

    if (!deadlineDate || !deadlineTime) return '请选择截止时间';

    // 验证截止时间是否在当前时间之后
    const now = new Date();
    const deadline = new Date(`${deadlineDate} ${deadlineTime}`);
    if (deadline <= now) return '截止时间必须晚于当前时间';

    if (subjectIndex < 0) return '请选择科目';
    if (problemTypeIndex < 0) return '请选择题型';

    if (!content || content.trim().length === 0) return '请输入题目描述';
    if (content.trim().length > 2000) return '题目描述不能超过2000个字符';

    // 选择题验证
    if (this.data.isChoice) {
      if (this.data.answerIndex < 0) return '请选择正确答案';

      // 检查选项是否为空
      let hasEmptyOption = false;
      let emptyOptionKey = '';
      for (let opt of this.data.options) {
        if (!opt.value.trim()) {
          hasEmptyOption = true;
          emptyOptionKey = opt.key;
          break;
        }
      }
      if (hasEmptyOption) return `请填写选项${emptyOptionKey}的内容`;

      // 检查选项数量（至少2个）
      if (this.data.options.length < 2) return '至少需要2个选项';

      // 检查选项内容是否重复
      const optionValues = this.data.options.map(opt => opt.value.trim().toLowerCase());
      const uniqueValues = [...new Set(optionValues)];
      if (uniqueValues.length !== optionValues.length) return '选项内容不能重复';
    } else {
      // 非选择题验证
      if (this.data.answer && this.data.answer.trim().length > 500) {
        return '参考答案不能超过500个字符';
      }
    }

    // 分值验证
    if (this.data.points !== undefined && this.data.points !== null) {
      const points = Number(this.data.points);
      if (isNaN(points) || points < 0 || points > 100) return '分值必须在0-100之间';
    }

    // 难度验证
    if (this.data.difficulty !== undefined && this.data.difficulty !== null) {
      const difficulty = Number(this.data.difficulty);
      if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) return '难度必须在1-5之间';
    }

    // 预计时间验证
    if (this.data.estimated_time !== undefined && this.data.estimated_time !== null) {
      const estimatedTime = Number(this.data.estimated_time);
      if (isNaN(estimatedTime) || estimatedTime < 1 || estimatedTime > 180) return '预计时间必须在1-180分钟之间';
    }

    return null;
  },

  // 提交表单
  submit: function (status) {
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    // 构建请求数据
    const payload = {
      class_id: this.data.classList[this.data.classIndex].id,
      title: this.data.title,
      deadline: `${this.data.deadlineDate} ${this.data.deadlineTime}:00`,
      subject: this.data.subjects[this.data.subjectIndex].id,
      problem_type: this.data.problemTypes[this.data.problemTypeIndex].id,
      content: this.data.content,
      difficulty: this.data.difficulty || 3,
      points: this.data.points || 10,
      estimated_time: this.data.estimated_time || 10,
      answer: this.data.isChoice ? this.data.options[this.data.answerIndex].value : this.data.answer,
      explanation: '',
      knowledge_points: [],
      tags: [], // 添加空标签列表
      custom_prompt: '' // 添加自定义提示词字段
    };

    // 如果有图片，添加到内容中
    if (this.data.contentImages.length > 0) {
      payload.content += '\n\n图片：\n' + this.data.contentImages.join('\n');
    }

    const token = wx.getStorageSync('accessToken');
    // 修复API路径：从 /grading/wx/push_assignment/ 改为 /assignment/wx/push_assignment/
    const url = `${app.globalData.globalUrl}/assignment/wx/push_assignment/`;

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: payload, // 直接发送对象，不要JSON.stringify
      success: (res) => {
        wx.hideLoading();
        console.log('API响应:', res);
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '作业发布成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.error || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onSaveDraft: function () {
    this.submit('DRAFT');
  },

  onPublish: function () {
    this.submit('PUBLISHED');
  },

  onDelete: function () {
    if (!this.data.assignmentId) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该作业吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('accessToken');
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `${app.globalData.globalUrl}/assignment/wx/delete_assignment/${this.data.assignmentId}/`,
            method: 'DELETE',
            header: { 'Authorization': `Bearer ${token}` },
            success: (res) => {
              wx.hideLoading();
              if (res.statusCode === 200 || res.statusCode === 204) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  }
});