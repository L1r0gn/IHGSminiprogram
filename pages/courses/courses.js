Page({
  data: {
    classList: [],
    isLoading: false,
    empty: false,
    userInfo: null,
    showCreateCourseModal: false,
    newCourseName: '',
    newCourseDesc: ''
  },

  onShow() {
    const app = getApp();

    // 如果 tab 切换了，重新加载页面
    if (app.globalData.currentTab !== 'courses') {
      app.globalData.currentTab = 'courses';
      wx.reLaunch({
        url: '/pages/courses/courses'
      });
      return;
    }

    // 获取用户信息
    this.fetchUserInfo();
  },

  // 获取用户信息
  fetchUserInfo() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');

    if (!token || !userId) {
      this.fetchJoinedClasses();
      return;
    }

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200 && res.data && res.data.data) {
          const userInfo = res.data.data;
          const userAttribute = Number(userInfo?.user_attribute);
          this.setData({ userInfo: userInfo });
          this.fetchJoinedClasses();
        }
      },
      fail: () => {
        this.fetchJoinedClasses();
      }
    });
  },

  // 获取已加入的班级（课程）
  fetchJoinedClasses() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');

    if (!token || !userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }, 1500);
      return;
    }

    this.setData({ isLoading: true });

    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          this.handleTokenExpired();
          return;
        }

        if (res.statusCode === 200 && res.data && res.data.data) {
          const classList = res.data.data.class_in || [];
          const enhancedClassList = classList.map(item => {
            return {
              ...item,
              color: this.getRandomColor(),
            };
          });
          this.setData({
            classList: enhancedClassList,
            empty: enhancedClassList.length === 0
          });
        } else {
          wx.showToast({
            title: '数据格式错误',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 处理token过期
  handleTokenExpired() {
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userId');
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }, 1500);
  },

  // 查看课程详情
  viewCourseDetail(e) {
    const courseInfo = e.currentTarget.dataset.course;
    const isTeacher = (this.data.userInfo && this.data.userInfo.user_attribute > 1);

    wx.navigateTo({
      url: `/pages/classFunction/classDetail/classDetail?classId=${courseInfo.id}&className=${courseInfo.name}&isTeacher=${isTeacher}`
    });
  },

  // 管理学生
  manageStudents(e) {
    const courseInfo = e.currentTarget.dataset.course;
    wx.navigateTo({
      url: `/pages/classMembers/classMembers?classId=${courseInfo.id}&className=${courseInfo.name}&isTeacher=true`
    });
  },

  // 管理作业
  manageHomework(e) {
    const courseData = e.currentTarget.dataset.course;
    wx.navigateTo({
      url: `/pages/teacher_mode/classHomeworkManagement/classHomeworkManagement?class_id=${courseData.id}`
    });
  },

  // 创建课程相关方法
  showCreateCourseModal() {
    this.setData({
      showCreateCourseModal: true,
      newCourseName: '',
      newCourseDesc: ''
    });
  },

  hideCreateCourseModal() {
    this.setData({ showCreateCourseModal: false });
  },

  onCourseNameInput(e) {
    this.setData({ newCourseName: e.detail.value });
  },

  onCourseDescInput(e) {
    this.setData({ newCourseDesc: e.detail.value });
  },

  createCourse() {
    const { newCourseName, newCourseDesc } = this.data;
    if (!newCourseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' });
      return;
    }

    const app = getApp();
    const token = wx.getStorageSync('accessToken');

    wx.request({
      url: `${app.globalData.globalUrl}/class/create/`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: { 'name': newCourseName },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 403) {
          wx.showToast({ title: '权限不足，仅教师可创建', icon: 'none' });
          return;
        }
        if (res.data.success) {
          wx.showToast({ title: '创建成功', icon: 'success' });
          this.setData({
            classList: res.data.user_classes,
            showCreateCourseModal: false
          });
        } else {
          wx.showToast({ title: res.data.error || '创建失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchJoinedClasses();
    wx.stopPullDownRefresh();
  },

  // 辅助函数：生成随机颜色
  getRandomColor() {
    const colors = [
      'linear-gradient(135deg, #5b86e5 0%, #36d1dc 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 加入班级（学生端）
  joinClass() {
    wx.navigateTo({
      url: '/pages/student_mode/myclass/myclass'
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡，避免触发卡片的点击事件
  }
});
