// pages/teacher_mode/assignChoice/assignChoice.js
const app = getApp();

Page({
  data: {
    class_id: '',
    className: ''
  },

  onLoad: function (options) {
    console.log('获取到参数：', options);
    this.setData({
      class_id: options.class_id,
      className: options.class_name || '班级'
    });
  },

  // 跳转到手动输入页面
  navigateToManualInput: function () {
    wx.navigateTo({
      url: `/pages/teacher_mode/manualInput/manualInput?class_id=${this.data.class_id}`
    });
  },

  // 跳转到班级作业管理页面
  navigateToClassHomeworkManagement: function () {
    wx.navigateTo({
      url: `/pages/teacher_mode/classHomeworkManagement/classHomeworkManagement?class_id=${this.data.class_id}`
    });
  },

  // 跳转到题库选择页面
  navigateToSelectQuestions: function () {
    wx.navigateTo({
      url: `/pages/teacher_mode/selectQuestions/selectQuestions?class_id=${this.data.class_id}`
    });
  }
})
