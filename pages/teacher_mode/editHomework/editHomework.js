// pages/teacher_mode/editHomework/editHomework.js
const app = getApp();

Page({
  data: {
    homeworkId: '',
    classId: '',
    formData: {
      title: '',
      subject: '',
      description: ''
    },
    date: '',
    time: '',
    today: new Date().toISOString().split('T')[0] // 限制日期选择不能早于今天
  },

  onLoad(options) {
    if (options.homework_id) {
      this.setData({
        homeworkId: options.homework_id,
        classId: options.class_id || '' // 最好能传过来
      });
      this.fetchHomeworkDetail();
    }
  },

  // 1. 获取作业详情进行回显
  fetchHomeworkDetail() {
    const token = wx.getStorageSync('accessToken');
    // 如果没有 classId，可能需要后端支持仅凭 homeworkId 查询，或者从缓存取
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
          
          // 处理截止时间拆分 "2023-11-30 23:59"
          let date = '';
          let time = '';
          if (data.deadline) {
            const parts = data.deadline.split(' ');
            if (parts.length === 2) {
              date = parts[0];
              time = parts[1]; // 可能需要截取前5位 HH:mm
              if(time.length > 5) time = time.substring(0, 5); 
            }
          }

          this.setData({
            formData: {
              title: data.title,
              subject: data.subject,
              description: data.description
            },
            date: date,
            time: time
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

  // 2. 提交保存
  submitEdit() {
    const { formData, date, time } = this.data;

    // 简单校验
    if (!formData.title.trim()) return wx.showToast({ title: '标题不能为空', icon: 'none' });
    if (!date || !time) return wx.showToast({ title: '请完善截止时间', icon: 'none' });

    const fullDeadline = `${date} ${time}`;

    wx.showLoading({ title: '保存中...' });

    // 假设更新接口 URL
    const url = `${app.globalData.globalUrl}/assignment/wx/update_assignment/${this.data.homeworkId}/`;

    wx.request({
      url: url,
      method: 'POST', // 或 PUT
      header: { 
        'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: formData.title,
        description: formData.description,
        deadline: fullDeadline,
        // subject: formData.subject // 如果允许修改科目则传
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({ title: '修改成功', icon: 'success' });
          
          // 延迟返回上一页，并通知上一页刷新
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.getHomeworkDetail) {
               // 刷新上一页的数据
               prevPage.getHomeworkDetail(this.data.homeworkId); 
            }
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '修改失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  }
});