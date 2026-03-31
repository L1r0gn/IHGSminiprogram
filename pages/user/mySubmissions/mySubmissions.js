const app = getApp();
const util = require('../../../utils/util.js');

Page({
  data: {
    mySubmissions: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    isLoading: false,
    empty: false
  },

  onLoad() {
    this.fetchSubmissions({ page: 1, refresh: true });
  },

  onShow() {
    // 如果需要每次显示都刷新，可以取消注释
    // this.fetchSubmissions({ page: 1, refresh: true });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.fetchSubmissions({ page: 1, refresh: true }, () => {
      wx.stopPullDownRefresh();
    });
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.isLoading || !this.data.hasMore) return;

    this.setData({
      page: this.data.page + 1
    });
    this.fetchSubmissions({ page: this.data.page });
  },

  fetchSubmissions(params = {}, callback) {
    if (this.data.isLoading && !params.refresh) return;

    this.setData({ isLoading: true });

    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId');
    const { page = this.data.page, limit = this.data.pageSize } = params;

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ isLoading: false, empty: true });
      return;
    }

    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/`,
      method: 'GET',
      data: {
        page: page,
        limit: limit,
        user_id: userId,
        sort_by: 'created_at:desc'
      },
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
          wx.removeStorageSync('userId');
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
          return;
        }

        if (res.statusCode === 200) {
          // 适配新旧接口结构
          const rawList = res.data.data || res.data.mySubmissions || [];

          // 处理数据，添加显示用的属性
          const processedList = rawList.map(item => {
            // 格式化时间
            let formattedTime = item.formatted_time || item.created_at || '';
            if (item.created_at) {
               try {
                 const date = new Date(item.created_at);
                 formattedTime = util.formatTime(date);
               } catch (e) {
                 console.error('时间格式化失败', e);
               }
            }

            return {
              ...item,
              id: item.record_id || item.id,
              formatted_time: formattedTime,
              question_title: item.question_title || '未知题目',
              statusClass: this.getStatusClass(item.status),
              statusText: this.getStatusText(item.status)
            };
          });

          if (params.refresh) {
            this.setData({
              mySubmissions: processedList,
              hasMore: rawList.length >= limit,
              empty: processedList.length === 0
            });
          } else {
            this.setData({
              mySubmissions: [...this.data.mySubmissions, ...processedList],
              hasMore: rawList.length >= limit,
              empty: false
            });
          }

          // 如果后端返回了 has_more 字段，直接使用
          if (typeof res.data.has_more !== 'undefined') {
            this.setData({ hasMore: res.data.has_more });
          }
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
        // 请求失败，页码回退
        if (!params.refresh && this.data.page > 1) {
          this.setData({ page: this.data.page - 1 });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
        if (callback) callback();
      }
    });
  },

  // 状态分类函数
  getStatusClass(status) {
    const statusMap = {
      'GRADED': 'correct',
      'ACCEPTED': 'correct',
      'PARTIALLY_CORRECT': 'partial',
      'RUNTIME_ERROR': 'wrong',
      'WRONG_ANSWER': 'wrong',
      'PENDING': 'pending'
    };
    return statusMap[status] || 'pending';
  },

  // 状态文本显示函数
  getStatusText(status) {
    const textMap = {
      'GRADED': '已评分',
      'ACCEPTED': '正确',
      'PARTIALLY_CORRECT': '部分正确',
      'RUNTIME_ERROR': '运行错误',
      'WRONG_ANSWER': '错误',
      'PENDING': '待批改'
    };
    return textMap[status] || status || '未知状态';
  },

  // 查看详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '记录ID无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/user/submissionDetail/submissionDetail?submissionId=${id}`
    });
  },

  // 开始答题
  goToPractice() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});