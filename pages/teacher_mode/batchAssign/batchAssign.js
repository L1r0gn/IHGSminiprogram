// pages/teacher_mode/batchAssign/batchAssign.js
const app = getApp();

Page({
  data: {
    class_id: '',
    selectedQuestions: [],
    titlePrefix: '批量作业',
    deadlineDate: '',
    deadlineTime: '23:59',
    isSubmitting: false,
    total: 0
  },

  onLoad(options) {
    const questions = wx.getStorageSync('temp_selected_questions') || [];
    this.setData({
      class_id: options.class_id,
      selectedQuestions: questions,
      total: questions.length,
      deadlineDate: this.getTomorrowDate()
    });
  },

  getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  },

  // 绑定 WXML 中的 bindtap="onSubmit"
  onSubmit() {
    const { class_id, selectedQuestions, titlePrefix, deadlineDate, deadlineTime } = this.data;
    const token = wx.getStorageSync('accessToken');
  
    if (selectedQuestions.length === 0) return;
  
    wx.showLoading({ title: '批量处理中...' });
  
    // 映射所有题目数据，确保字段名与后端 v3 接口一致
    const problemsPayload = selectedQuestions.map((q, index) => ({
      id:q.id,
      title: q.title,
      content: q.content,
      problem_type: q.problem_type_id || q.problem_type, // 确保是 ID
      subject: q.subject_id || q.subject,               // 确保是 ID
      difficulty: q.difficulty || 2,
      points: q.points || 10,
      answer: q.answer || '',
      explanation: q.explanation || q.analysis || '',
      tags: (q.tags || []).map(t => typeof t === 'object' ? t.id : t),
      knowledge_points: (q.knowledge_points || []).map(k => typeof k === 'object' ? k.id : k),
      estimated_time: q.estimated_time || 5
    }));
    const sent_data = {
      class_id: class_id,
      title_prefix: titlePrefix,
      deadline: `${deadlineDate}T${deadlineTime}:00Z`,
      problems: problemsPayload
    }
    console.log('发送数据：',sent_data)
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/batch_push_assignments/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: sent_data,
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '全部发布成功', icon: 'success' });
          wx.removeStorageSync('temp_selected_questions');
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showModal({ title: '发布失败', content: res.data.error, showCancel: false });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  onTitleInput(e) { this.setData({ titlePrefix: e.detail.value }); },
  onDateChange(e) { this.setData({ deadlineDate: e.detail.value }); },
  onTimeChange(e) { this.setData({ deadlineTime: e.detail.value }); },

  removeQuestion(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.selectedQuestions;
    list.splice(index, 1);
    this.setData({ selectedQuestions: list, total: list.length });
  }
});