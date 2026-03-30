Page({
  data: {
    classList: [],
    isLoading: false,
    showJoinModal: false,
    classCode: '',
    empty: false
  },

  onShow() {
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
      
      wx.request({
        url: `${app.globalData.globalUrl}/user/wx/userJoinClass/`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
        },
        data: {
          class_code: classCode
        },
        success: (res) => {
          if (res.statusCode === 200) {
            wx.showToast({
              title: '加入成功',
              icon: 'success'
            });
            this.hideJoinModal();
            this.fetchJoinedClasses(); // 刷新班级列表
          } else if (res.statusCode === 403 && res.data.message === "只有学生可加入班级") {
             wx.showToast({
               title: '只有学生身份可加入班级',
               icon: 'none'
             });
          } else if (res.statusCode === 400) {
            wx.showToast({
              title: res.data.message || '班级码错误',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: res.data.message || '加入失败',
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
              studentCount: item.studentCount || 0
            };
          });
          this.setData({
            classList: enhancedClassList,
            empty: enhancedClassList.length === 0
          });
        } else {
          this.setData({
            classList: [],
            empty: true
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
      url: `/pages/classFunction/classDetail/classDetail?classId=${classInfo.id}&className=${classInfo.name}`
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
  }
});