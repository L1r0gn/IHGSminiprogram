const app = getApp();

Page({
  data: {
    mySubmissions: []
  },

  onLoad() {
    this.fetchSubmissions();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchSubmissions(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchSubmissions(callback) {
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '用户未登录', icon: 'none' });
      return;
    }
    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          wx.removeStorageSync('accessToken');
          wx.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        if (res.statusCode === 200 && res.data) {
          this.setData({
            mySubmissions: res.data.mySubmissions
          });
          console.log('处理后的个人做题记录：', this.data.mySubmissions);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        if (callback) callback();
      }
    });
  },

  // 状态分类函数
  getStatusClass(status) {
    const statusMap = {
      'GRADED': 'correct',
      'ACCEPTED': 'correct',
      'RUNTIME_ERROR': 'incorrect',
      'PENDING': 'pending'
    };
    return statusMap[status] || 'pending';
  },

  // 状态文本显示函数
  getStatusText(status) {
    const textMap = {
      'GRADED': '已评分',
      'ACCEPTED': '已通过',
      'RUNTIME_ERROR': '运行错误',
      'PENDING': '待批改'
    };
    return textMap[status] || '未知状态';
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击了id为',id,'的查看详情按钮');
    wx.navigateTo({
      url: `/pages/user/submissionDetail/submissionDetail?submissionId=${id}`
    });
  }
});