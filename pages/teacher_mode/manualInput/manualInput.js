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
      url: `${app.globalData.globalUrl}/assignment/wx/get_problem_meta_data/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            problemTypes: res.data.data.problemTypes,
            subjects: res.data.data.subjects,
            tags: res.data.data.tags,
          });
        }
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

    // 使用通用上传接口或专门的作业图片上传接口
    wx.uploadFile({
      url: `${app.globalData.globalUrl}/common/wx/upload/image/`, // 假设的上传接口
      filePath: filePath,
      name: 'file',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.url) {
              const images = [...this.data.contentImages, data.url];
              this.setData({ contentImages: images });
            } else {
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析响应失败', e);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
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
    if (!title) return '请输入标题';
    if (classIndex < 0) return '请选择目标班级';
    if (!deadlineDate || !deadlineTime) return '请选择截止时间';
    if (subjectIndex < 0) return '请选择科目';
    if (problemTypeIndex < 0) return '请选择题型';
    if (!content) return '请输入题目描述';

    if (this.data.isChoice) {
      if (this.data.answerIndex < 0) return '请选择正确答案';
      // 检查选项是否为空
      for (let opt of this.data.options) {
        if (!opt.value.trim()) return `请填写选项${opt.key}的内容`;
      }
    } else {
      // 非选择题可以允许参考答案为空，视业务需求而定，这里暂不校验
    }
    return null;
  },

  collectFormData: function (status) {
    const {
      title, classList, classIndex, deadlineDate, deadlineTime,
      problemTypes, problemTypeIndex, content, contentImages,
      options, isChoice, answerIndex, answer
    } = this.data;

    const contentData = {
      images: contentImages
    };

    if (isChoice) {
      contentData.options = options;
    }

    const payload = {
      class_id: classList[classIndex].id,
      title: title,
      status: status,
      problem_type: problemTypes[problemTypeIndex].id,
      subject: subjects[subjectIndex].id,
      content: content,
      content_data: contentData, // 结构化数据
      deadline: `${deadlineDate} ${deadlineTime}:00`, // 拼接时间
      difficulty: this.data.difficulty,
      points: this.data.points,
      estimated_time: this.data.estimated_time,
      tags: [], // 暂无标签选择
      knowledge_points: [], // 暂无知识点选择
      explanation: '无' // 暂无解析输入
    };

    if (isChoice) {
      payload.answer = options[answerIndex].key;
    } else {
      payload.answer = answer;
    }

    return payload;
  },

  submit: function (status) {
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    const payload = this.collectFormData(status);
    const token = wx.getStorageSync('accessToken');
    const url = this.data.assignmentId
      ? `${app.globalData.globalUrl}/assignment/wx/update_assignment/${this.data.assignmentId}/`
      : `${app.globalData.globalUrl}/assignment/wx/push_assignment/`;

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({
            title: status === 'PUBLISHED' ? '发布成功' : '已存草稿',
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
      fail: () => {
        wx.hideLoading();
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