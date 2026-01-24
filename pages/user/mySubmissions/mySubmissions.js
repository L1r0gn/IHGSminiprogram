const app = getApp();
const util = require('../../../utils/util.js');

Page({
  data: {
    mySubmissions: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    this.fetchSubmissions({ page: 1, refresh: true });
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
      wx.showToast({ title: '用户未登录', icon: 'none' });
      this.setData({ isLoading: false });
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
          wx.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        if (res.statusCode === 200) {
          // 适配新旧接口结构 (优先使用新结构 res.data.data, 兼容旧结构 res.data.mySubmissions)
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
              // 关键修正：映射 record_id 到 id，确保 WXML 中的 item.id 和 data-id 能取到值
              id: item.record_id || item.id,
              // 确保 formatted_time 存在
              formatted_time: formattedTime,
              statusClass: this.getStatusClass(item.status),
              statusText: this.getStatusText(item.status)
            };
          });

          if (params.refresh) {
            this.setData({
              mySubmissions: processedList,
              hasMore: rawList.length >= limit
            });
          } else {
            this.setData({
              mySubmissions: [...this.data.mySubmissions, ...processedList],
              hasMore: rawList.length >= limit
            });
          }

          // 如果后端返回了 has_more 字段，直接使用
          if (typeof res.data.has_more !== 'undefined') {
            this.setData({ hasMore: res.data.has_more });
          }
          
          console.log('当前做题记录列表：', this.data.mySubmissions);
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

  // 状态分类函数 (同步 submissionDetail.js 的逻辑)
  getStatusClass(status) {
    const statusMap = {
      'GRADED': 'correct',
      'ACCEPTED': 'correct',
      'RUNTIME_ERROR': 'incorrect',
      'WRONG_ANSWER': 'incorrect',
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
      'WRONG_ANSWER': '答案错误',
      'PENDING': '待批改'
    };
    return textMap[status] || status || '未知状态';
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击了id为',id,'的查看详情按钮');
    if (!id) {
      wx.showToast({ title: '记录ID无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/user/submissionDetail/submissionDetail?submissionId=${id}`
    });
  }
});