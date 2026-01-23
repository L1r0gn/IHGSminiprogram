// pages/teacher_mode/assignChoice/assignChoice.js
Page({

  /*** 页面的初始数据*/
  data: {
    recentHomeworks: [],
    class_id:'',
  },
  
  onLoad:function(options){
    console.log('获取到参数：',options);
    this.setData({
      class_id:options.class_id,
    });
  },
  /*** 跳转到AI拍照识别页面*/
  navigateToAIScan: function() {
    wx.navigateTo({
      url: '/pages/teacher_mode/aiScan/aiScan'
    });
  },

  /*** 跳转到手动输入页面*/
  navigateToManualInput: function() {
    wx.navigateTo({
      url: `/pages/teacher_mode/manualInput/manualInput?class_id=${this.data.class_id}`
    });
  },

  /*** 跳转到班级作业管理页面*/
  navigateToClassHomeworkManagement:function () {
    wx.navigateTo({
      url: `/pages/teacher_mode/classHomeworkManagement/classHomeworkManagement?class_id=${this.data.class_id}`
    });
  },

  /*** 复用已有作业*/
  reuseHomework: function(e) {
    const homeworkId = e.currentTarget.dataset.id;
    const homework = this.data.recentHomeworks.find(item => item.id === homeworkId);
    
    wx.showModal({
      title: '复用作业',
      content: `确定要复用作业"${homework.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 这里可以添加复用作业的逻辑
          wx.showToast({
            title: '作业复用成功',
            icon: 'success'
          });
          
          // 可以跳转到编辑页面，携带作业ID
          // wx.navigateTo({
          //   url: `/pages/teacher_mode/editHomework/editHomework?id=${homeworkId}`
          // });
        }
      }
    });
  },
})