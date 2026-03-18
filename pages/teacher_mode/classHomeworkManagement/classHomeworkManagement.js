// /pages/teacher_mode/classHomeworkManagement/classHomeworkManagement.js
Page({

  data: {
    class_id: null,
    homeworkList: [], // 作业列表
    isLoading: true,  // 是否正在加载
  },

  /**
   * 格式化日期
   */
  formatDateTime: function(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isThisYear) {
      return `${month}-${day} ${hours}:${minutes}`;
    } else {
      return `${date.getFullYear()}-${month}-${day}`;
    }
  },

  /**
   * 判断作业是否过期
   */
  isExpired: function(deadline) {
    if (!deadline) return false;
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    return now > deadlineTime;
  },

  /**
   * 页面加载时，获取class_id
   */
  onLoad: function (options) {
    if (options.class_id) {
      this.setData({
        class_id: options.class_id
      });
    } else {
      // 异常处理
      wx.showToast({
        title: '页面参数错误',
        icon: 'none',
        duration: 2000,
        complete: () => setTimeout(wx.navigateBack, 2000)
      });
    }
  },

  /**
   * 页面显示时，加载数据
   * 使用 onShow 是为了在从详情页返回时也能刷新列表
   */
  onShow: function () {
    if (this.data.class_id) {
      this.fetchHomeworkList();
    }
  },

  /**
   * 核心函数：从服务器获取作业列表
   */
  fetchHomeworkList: function () {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    // TODO: 替换成你自己的后端API
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/teacher_get_assignments/${this.data.class_id}`,  
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
          // 假设后端返回的数据在 res.data
          console.log('收到后端数据: ',res.data.data);
          const homeworkList = (res.data.data || []).map(item => ({
            ...item,
            created_at: this.formatDateTime(item.created_at),
            deadline: item.deadline ? this.formatDateTime(item.deadline) : null,
            isExpired: this.isExpired(item.deadline)
          }));
          this.setData({
            homeworkList: homeworkList
          });
        } else {
          wx.showToast({
            title: res.data.message || '数据加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        console.error('获取作业列表失败:', err);
      },
      complete: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh(); // 停止下拉刷新动画
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 监听用户下拉刷新
  */
  onPullDownRefresh: function () {
    if (this.data.class_id) {
      this.fetchHomeworkList();
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 跳转到作业详情页
   */
  navigateToDetail: function (e) {
    const homeworkId = e.currentTarget.dataset.homeworkId;
    console.log('跳转到assignment_id为',homeworkId,'的作业详情页')
    wx.navigateTo({
      // TODO: 确认你的作业详情页路径
      url: `/pages/teacher_mode/homeworkDetail/homeworkDetail?assignment_id=${homeworkId}&class_id=${this.data.class_id}`
    });
  },

  /**
   * 跳转到编辑作业页
   */
  navigateToEdit: function (e) {
    const homeworkId = e.currentTarget.dataset.homeworkId;
    console.log('跳转到assignment_id为',homeworkId,'的编辑作业页')
    wx.navigateTo({
      url: `/pages/teacher_mode/editHomework/editHomework?homework_id=${homeworkId}&class_id=${this.data.class_id}`
    });
  }
});
