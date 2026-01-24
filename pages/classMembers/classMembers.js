// pages/classMembers/classMembers.js
const app = getApp();

Page({
  data: {
    classId: '',
    className: '',
    memberList: [],
    isTeacher: false, // 是否是老师，控制是否显示移除按钮
    isLoading: false
  },

  onLoad(options) {
    this.setData({
      classId: options.classId,
      className: options.className,
      isTeacher: options.isTeacher === 'true' // 从参数获取角色信息
    });
    this.fetchMembers();
  },

  onPullDownRefresh() {
    this.fetchMembers(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchMembers(callback) {
    const token = wx.getStorageSync('accessToken');
    if (!token) return;

    this.setData({ isLoading: true });
    
    wx.request({
      url: `${app.globalData.globalUrl}/class/${this.data.classId}/members/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 根据新接口响应结构调整
          const memberList = res.data.data || [];
          // 处理数据，适配 WXML
          const processedList = memberList.map(member => ({
            ...member,
            // 确保显示名优先使用昵称
            displayName: member.name || member.nickname || member.username, 
            // 确保头像有默认值
            avatar: member.avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
          }));
          
          this.setData({
            memberList: processedList
          });
        } else if (res.statusCode === 401) {
          app.handleTokenExpired();
        } else {
          wx.showToast({ title: '获取成员失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        this.setData({ isLoading: false });
        if (callback) callback();
      }
    });
  },

  confirmRemove(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '移除成员',
      content: `确定要将 ${name} 移出班级吗？`,
      success: (res) => {
        if (res.confirm) {
          this.removeMember(id);
        }
      }
    });
  },

  removeMember(userId) {
    const token = wx.getStorageSync('accessToken');
    wx.showLoading({ title: '处理中' });

    wx.request({
      url: `${app.globalData.globalUrl}/class/${this.data.classId}/members/${userId}/`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '已移除', icon: 'success' });
          this.fetchMembers(); // 刷新列表
        } else {
          wx.showToast({ title: res.data.message || '移除失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
