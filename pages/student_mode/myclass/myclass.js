Page({
  data: {
    classList: [],
    isLoading: false,
    showJoinModal: false,
    classCode: ''
  },

  onLoad() {
    this.fetchJoinedClasses();
  },

    // 显示加入班级弹窗
    showJoinModal() {
      this.setData({
        showJoinModal: true,
        classCode: ''
      });
    },
  
    // 隐藏加入班级弹窗
    hideJoinModal() {
      this.setData({
        showJoinModal: false,
        classCode: ''
      });
    },
  
    // 阻止弹窗内容点击事件冒泡
    stopPropagation() {
      return;
    },
  
    // 班级码输入
    onClassCodeInput(e) {
      this.setData({
        classCode: e.detail.value.trim()
      });
    },
  
    // 加入班级
    joinClass() {
      const classCode = this.data.classCode;
      if (!classCode) {
        wx.showToast({
          title: '请输入班级码',
          icon: 'none'
        });
        return;
      }
      this.setData({ isLoading: true });
      const app = getApp();
      const token = wx.getStorageSync('accessToken');
      const userId = wx.getStorageSync('userId');
      wx.request({
        url: `${app.globalData.globalUrl}/user/wx/userJoinClass/`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
        },
        data: {
          class_code: classCode,
          user_id: userId
        },
        success: (res) => {
          if (res.statusCode === 200) {
            wx.showToast({
              title: '加入成功',
              icon: 'success'
            });
            this.hideJoinModal();
            this.fetchJoinedClasses(); // 刷新班级列表
          } else if (res.statusCode === 400) {
            wx.showToast({
              title: res.data.message || '班级码错误',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '加入失败',
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

  // 获取已加入的班级
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
        wx.navigateTo({
          url: '/pages/login/login'
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
          // 为每个班级添加样式和老师信息
          const enhancedClassList = classList.map(item => {
            return {
              ...item,
              color: this.getRandomColor()
            };
          });
          this.setData({ classList: enhancedClassList });
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
    wx.removeStorageSync('userId');
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
  },

  // 查看班级详情
  viewClassDetail(e) {
    const classInfo = e.currentTarget.dataset.class;
    wx.navigateTo({
      url: `/pages/classDetail/classDetail?classId=${classInfo.id}&className=${classInfo.name}`
    });
  },

  // 跳转到加入班级页面
  goToJoinPage() {
    wx.navigateTo({ 
      url: '/pages/joinClass/joinClass' 
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
  }
});