// pages/classManage/classManage.js
const app = getApp();

Page({
  data: {
    classList: [],
    // 页面配置变量
    showCreateClassModal: false,
    showAssignHomeworkModal: false,
    // 新建班级变量
    newClassName: '',
    newClassDesc: '',
    // 当前班级变量
    currentClass: {},
    // 作业变量
    homeworkTitle: '',
    homeworkDescription: '',
    homeworkDeadline: '',
    selectedProblems: [],
    today: ''
  },

  onLoad() {
    // 设置今天日期，用于日期选择器
    const today = new Date().toISOString().split('T')[0];
    this.setData({ today });
    this.loadClassList();
  },

  onPullDownRefresh() {
    this.loadClassList(() => {
      wx.stopPullDownRefresh();
    });
  },
  // 加载班级
  loadClassList(callback) {
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken')
    // 模拟数据
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,  
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
        //保存数据
        console.log('收到用户数据:',res.data.data);
        this.setData({
          classList:res.data.data.class_in,
        })
        console.log('当前用户的班级为:',this.data.classList);
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
    if (callback) callback();
  },
  // 新建班级相关方法
  showCreateClassModal() {
    this.setData({
      showCreateClassModal: true,
      newClassName: '',
      newClassDesc: ''
    });
  },
  hideCreateClassModal() {
    this.setData({ showCreateClassModal: false });
  },
  onClassNameInput(e) {
    this.setData({ newClassName: e.detail.value });
  },
  onClassDescInput(e) {
    this.setData({ newClassDesc: e.detail.value });
  },
  createClass() {
    const { newClassName, newClassDesc } = this.data;
    if (!newClassName.trim()) {
      wx.showToast({ title: '请输入班级名称', icon: 'none' });
      return;
    }
    const newClass = {
      className: newClassName,
    };
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    this.setData({
      classList: [newClass, ...this.data.classList],
      showCreateClassModal: false
    });
    wx.request({
      url: `${app.globalData.globalUrl}/class/create/`,
      method:'POST',
      header:{
        'Authorization': `Bearer ${token}`
      },
      data : {'name':newClassName},
      success: (res) => {
        if(res.statusCode == 401)
        {
          app.handleTokenExpired();
          return;
        }
        if (res.data.success) {
          wx.showToast({ title: res.data.message, icon: 'success' });
          this.setData({
            classList: res.data.user_classes  
          });
        } else {
          wx.showToast({ title: res.data.error || '失败', icon: 'none' });
        }
      }
    })
    wx.showToast({ title: '创建成功', icon: 'success' });
  },
  // 管理学生
  manageStudents(e) {
    const classInfo = e.currentTarget.dataset.class;
    wx.showModal({
      title: '管理学生',
      content: `进入${classInfo.name}的学生管理页面`,
      showCancel: false
    });
  },
  hideAssignHomeworkModal() {
    this.setData({ showAssignHomeworkModal: false });
  },
  onHomeworkTitleInput(e) {
    this.setData({ homeworkTitle: e.detail.value });
  },
  onHomeworkDescInput(e) {
    this.setData({ homeworkDescription: e.detail.value });
  },
  onDeadlineChange(e) {
    this.setData({ homeworkDeadline: e.detail.value });
  },
  removeProblem(e) {
    const index = e.currentTarget.dataset.index;
    const problems = [...this.data.selectedProblems];
    problems.splice(index, 1);
    this.setData({ selectedProblems: problems });
  },
  // 查看班级详情
  viewClassDetail(e) {
    const classInfo = e.currentTarget.dataset.class;
    wx.showModal({
      title: '班级详情',
      content: `查看${classInfo.name}的详细信息`,
      showCancel: false
    });
  },
  assignHomework(e){
    const classData = e.currentTarget.dataset.class;
    console.log('班级数据:', classData);
    wx.navigateTo({
      url: `/pages/teacher_mode/assignChoice/assignChoice?class_id=${classData.id}`
    });
  }
});