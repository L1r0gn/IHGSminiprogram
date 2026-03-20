// /pages/teacher_mode/classHomeworkManagement/classHomeworkManagement.js
const app = getApp();

Page({
  data: {
    class_id: null,
    className: '',
    homeworkList: [], // 作业列表
    isLoading: true,  // 是否正在加载
    stats: {
      total: 0,
      active: 0,
      expired: 0,
      graded: 0
    }
  },

  /**
   * 格式化日期
   */
  formatDateTime: function (dateStr) {
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
  isExpired: function (deadline) {
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
        class_id: options.class_id,
        className: options.class_name || '班级'
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
    const token = wx.getStorageSync('accessToken');
    // 使用正确的API端点
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
        if (res.statusCode === 200 && res.data.success) {
          // 后端返回的数据在 res.data.data
          console.log('收到后端数据: ', res.data.data);
          const homeworkList = (res.data.data || []).map(item => ({
            ...item,
            created_at: this.formatDateTime(item.created_at),
            deadline: item.deadline ? this.formatDateTime(item.deadline) : null,
            isExpired: this.isExpired(item.deadline)
          }));

          // 计算统计数据
          const stats = {
            total: homeworkList.length,
            active: homeworkList.filter(item => !item.isExpired).length,
            expired: homeworkList.filter(item => item.isExpired).length,
            graded: homeworkList.filter(item => item.status === 'GRADED').length
          };

          this.setData({
            homeworkList: homeworkList,
            stats: stats
          });
        } else {
          wx.showToast({
            title: res.data.error || '数据加载失败',
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
    console.log('跳转到assignment_id为', homeworkId, '的作业详情页')
    wx.navigateTo({
      // TODO: 确认你的作业详情页路径
      url: `/pages/teacher_mode/homeworkDetail/homeworkDetail?assignment_id=${homeworkId}&class_id=${this.data.class_id}`
    });
  },

  /**
   * 跳转到发布作业页面
   */
  navigateToAssignChoice: function () {
    wx.navigateTo({
      url: `/pages/teacher_mode/assignChoice/assignChoice?class_id=${this.data.class_id}&class_name=${this.data.className}`
    });
  },

  /**
   * 删除作业
   */
  deleteHomework: function (e) {
    const homeworkId = e.currentTarget.dataset.homeworkId;
    const homeworkTitle = e.currentTarget.dataset.homeworkTitle;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除作业"${homeworkTitle}"吗？删除后无法恢复。`,
      success: (res) => {
        if (res.confirm) {
          this.deleteHomeworkRequest(homeworkId);
        }
      }
    });
  },

  /**
   * 发送删除请求
   */
  deleteHomeworkRequest: function (homeworkId) {
    const token = wx.getStorageSync('accessToken');
    wx.showLoading({ title: '删除中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/delete_assignment/${homeworkId}/`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 || res.statusCode === 204) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 刷新列表
          this.fetchHomeworkList();
        } else {
          wx.showToast({
            title: res.data.error || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        console.error('删除作业失败:', err);
      }
    });
  },

  /**
   * 复制作业链接
   */
  copyHomeworkLink: function (e) {
    const homeworkId = e.currentTarget.dataset.homeworkId;
    const link = `${app.globalData.globalUrl}/assignment/${homeworkId}/`;

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 查看作业统计
   */
  viewHomeworkStats: function (e) {
    const homeworkId = e.currentTarget.dataset.homeworkId;
    wx.navigateTo({
      url: `/pages/teacher_mode/homeworkStats/homeworkStats?assignment_id=${homeworkId}&class_id=${this.data.class_id}`
    });
  }
});
