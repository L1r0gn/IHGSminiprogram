// pages/classDetail/classDetail.js
Page({
  data: {
    classId: '',
    classInfo: {},
    recentHomeworks: [],
    isLoading: false,
    showQuitConfirm: false
  },

  onLoad(options) {
    const { classId, className } = options;
    this.setData({
      classId: classId,
      'classInfo.id':classId,
      'classInfo.name': className
    });
    this.fetchClassDetail();
    this.fetchRecentHomeworks();
  },

  // 获取班级详情
  fetchClassDetail() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId')    
    this.setData({ isLoading: true });
    //发出请求 class/${userId}/${this.data.classId}/
    wx.request({
      url: `${app.globalData.globalUrl}/class/${this.data.classId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          console.log('收到classData:',res.data.data);
          const classData = res.data.data || {};
          this.setData({
            classInfo: {
              ...classData,
              color: this.getRandomColor(),
              teacher_name: classData.created_by_name || '未知老师',
              create_time: this.formatTime(classData.created_at),
              description: classData.description || '暂无描述'
            }
          });
        } else {
          wx.showToast({
            title: '获取班级信息失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 获取最近作业
  fetchRecentHomeworks() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    console.log(`查询班级id为${this.data.classId}的作业`);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'ClassId': String(this.data.classId), 
    };
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/show_assignment/`,  
      method: 'GET',
      header: headers,
      success: (res) => {
        if (res.statusCode === 401) {
          this.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          const homeworks = (res.data.data || []).map(hw => ({
            ...hw,
            status_text: this.getStatusText(hw.status),
            deadline: this.formatTime(hw.deadline),
            submit_count: hw.submit_count || 0
          }));
          console.log('收到最近作业：',homeworks);
          this.setData({ recentHomeworks: homeworks });
        }
      }
    });
  },
  // 查看作业详情
  viewHomework(e) {
    const homework = e.currentTarget.dataset.homework;
    wx.navigateTo({
      url: `/pages/homeworkDetail/homeworkDetail?homeworkId=${homework.id}&classId=${this.data.classId}`
    });
  },
  // 跳转到作业列表
  goToHomework() {
    console.log('发送给下一个页面的数据：',this.data.classInfo);
    wx.navigateTo({
      url: `/pages/myclass/showHomework/showHomework?class_id=${this.data.classInfo.id}&class_name=${this.data.classInfo.name}&class_code=${this.data.classInfo.code}&class_teacher=${this.data.classInfo.created_by}&class_created_time=${this.data.classInfo.created_at}`
    });
  },
  // 跳转到班级成员
  goToMembers() {
    wx.navigateTo({
      url: `/pages/classMembers/classMembers?classId=${this.data.classId}&className=${this.data.classInfo.name}`
    });
  },

  // 跳转到课程表
  goToSchedule() {
    wx.navigateTo({
      url: `/pages/classSchedule/classSchedule?classId=${this.data.classId}&className=${this.data.classInfo.name}`
    });
  },

  // 跳转到班级通知
  goToAnnouncements() {
    wx.navigateTo({
      url: `/pages/announcements/announcements?classId=${this.data.classId}&className=${this.data.classInfo.name}`
    });
  },

  // 显示退出确认弹窗
  showQuitConfirm() {
    this.setData({ showQuitConfirm: true });
  },

  // 隐藏退出确认弹窗
  hideQuitConfirm() {
    this.setData({ showQuitConfirm: false });
  },

  // 阻止事件冒泡
  stopPropagation() {
    return;
  },

  // 退出班级
  quitClass() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    
    this.setData({ isLoading: true });
    
    wx.request({
      url: `${app.globalData.globalUrl}/class/quit/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
      },
      data: {
        class_id: this.data.classId,
        user_id: userId
      },
      success: (res) => {
        if (res.statusCode === 401) {
          this.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '退出失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ 
          isLoading: false,
          showQuitConfirm: false 
        });
      }
    });
  },

  // 辅助函数：获取状态文本
  getStatusText(status) {
    const statusMap = {
      'PENDING': '待提交',
      'SUBMITTED': '已提交',
      'OVERDUE': '已逾期',
      'GRADED': '已批改'
    };
    return statusMap[status] || '未知状态';
  },

  // 辅助函数：格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '未知时间';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 辅助函数：生成随机颜色
  getRandomColor() {
    const colors = [
      'linear-gradient(135deg, #5b86e5 0%, #36d1dc 100%)',
      // 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      // 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      // 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      // 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },
})