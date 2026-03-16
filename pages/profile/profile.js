const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: null,
    defaultAvatarUrl: defaultAvatarUrl,
    isLoggedIn: false,
    isTeacher: false,
    isStudent: false,
    userId: null,
    learningStats: {
      totalQuestions: 0,
      accuracy: 0,
      studyDays: 0
    }
  },

  onShow() {
    const app = getApp();

    // 如果 tab 切换了，重新加载页面
    if (app.globalData.currentTab !== 'profile') {
      app.globalData.currentTab = 'profile';
      wx.reLaunch({
        url: '/pages/profile/profile'
      });
      return;
    }

    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    const isLoggedIn = !!(token && userId);

    this.setData({ isLoggedIn, userId });

    if (isLoggedIn) {
      this.fetchUserInfo();
    }
  },

  fetchUserInfo() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');

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
        if (res.statusCode === 200 && res.data.data) {
          this.setData({
            userInfo: res.data.data
          });
          this.updateUserRole();
          this.fetchLearningStats();
        }
      }
    });
  },

  updateUserRole() {
    const attr = Number(this.data.userInfo?.user_attribute);
    this.setData({
      isStudent: attr === 1,
      isTeacher: attr === 2
    });
  },

  fetchLearningStats() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');

    // 计算注册天数
    const userInfo = this.data.userInfo;
    let studyDays = 0;
    if (userInfo && userInfo.date_joined) {
      const joinDate = new Date(userInfo.date_joined);
      const now = new Date();
      const diffTime = Math.abs(now - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      studyDays = diffDays > 0 ? diffDays : 1; // 至少1天
    }

    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        sort_by: 'submitted_time:desc'
      },
      success: (res) => {
        if (res.data.data) {
          const submissions = res.data.data || [];
          const totalQuestions = submissions.length;

          // 使用得分率计算正确数，与做题记录页面逻辑保持一致
          let correctCount = 0;
          submissions.forEach(item => {
            const studentScore = item.student_score || item.score || 0;
            const questionScore = item.question_score || 10;
            const scoreRatio = questionScore > 0 ? (studentScore / questionScore) : 0;
            if (scoreRatio >= 1) {
              correctCount++;
            }
          });

          const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(1) : 0;

          this.setData({
            learningStats: {
              totalQuestions: res.data.total_count || totalQuestions,
              accuracy: accuracy,
              studyDays: studyDays
            }
          });
        }
      }
    });
  },

  // 登录
  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 编辑个人资料
  editProfile() {
    wx.navigateTo({
      url: '/pages/user/edit/edit'
    });
  },

  // 信息管理
  manageInfo() {
    wx.navigateTo({
      url: '/pages/user/list/userList'
    });
  },

  // 提交记录
  viewSubmissionRecord() {
    wx.navigateTo({
      url: '/pages/user/learningStats/learningStats'
    });
  },

  // 我的班级
  viewMyClass() {
    wx.navigateTo({
      url: '/pages/student_mode/myclass/myclass'
    });
  },

  // 班级管理
  manageClass() {
    wx.navigateTo({
      url: '/pages/classFunction/classManage/classManage'
    });
  },

  // 知识画像
  viewKnowledgeProfile() {
    wx.navigateTo({
      url: '/pages/student_mode/learningInsights/knowledgeProfile'
    });
  },

  // 我的提交
  viewSubmissions() {
    wx.navigateTo({
      url: '/pages/user/mySubmissions/mySubmissions'
    });
  },

  // 关于系统
  showAbout() {
    wx.showModal({
      title: '关于',
      content: '智能批改作业系统 v1.0.0\n基于知识追踪算法的智能学习系统',
      showCancel: false
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('accessToken');
          wx.removeStorageSync('refreshToken');
          wx.removeStorageSync('userId');
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('userInfo');
          
          this.setData({
            userInfo: null,
            isLoggedIn: false,
            isTeacher: false,
            isStudent: false,
            userId: null
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});
