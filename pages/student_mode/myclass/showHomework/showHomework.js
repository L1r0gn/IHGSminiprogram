// pages/showHomework/showHomework.js
Page({
  data: {
    classInfo: {
      name: '',
      code: '',
      teacher: '',
      createTime: '',
      description: ''
    },
    homeworks: [],
    currentFilter: 'all',
    filteredHomeworks: [],
    redo: false,
  },

  onLoad: function (options) {
    // 可以从options获取班级ID等信息
    console.log('获取到上一个页面的参数', options);
    this.setData({
      'classInfo.name': options.class_name,
      'classInfo.code': options.class_code,
      'classInfo.id': options.class_id,
      'classInfo.createTime': options.class_created_time.substr(0, 10),
      'classInfo.teacher': options.class_teacher,
    })
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.refreshHomeworkList();
    this.loadClassData(this.data.classInfo.id);
  },

  // 加载班级数据
  loadClassData: function (classId) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    // 调用API获取班级信息和作业列表
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/show_assignment/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'ClassId': this.data.classInfo.id,
      },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.data.success) {
          console.log('收到后端数据:', res.data);
          this.setData({
            homeworks: res.data.data
          });
          console.log('收到作业:', this.data.homeworks);
          this.filterHomeworks(this.data.currentFilter);
        }
      },
      fail: (err) => {
        console.error('加载班级数据失败:', err);
      }
    });
  },

  // 刷新作业列表
  refreshHomeworkList: function () {
    // 这里可以重新从服务器获取数据
    console.log('刷新作业列表');
  },

  // 切换筛选条件
  switchFilter: function (e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterHomeworks(filter);
  },

  // 筛选作业
  filterHomeworks: function (filter) {
    let filtered = [];

    switch (filter) {
      case 'all':
        filtered = this.data.homeworks;
        break;
      case 'PENDING':
        // console.log('切换为PENDING');
        filtered = this.data.homeworks.filter(hw => hw.status === 'PENDING');
        break;
      case 'SUBMITTED':
        // console.log('切换为SUBMITTED');
        filtered = this.data.homeworks.filter(hw =>
          hw.status === 'SUBMITTED' || hw.status === 'WRONG_ANSWER' || hw.status === 'ACCEPTED'
        );
        break;
      case 'GRADED':
        // console.log('切换为GRADED');
        filtered = this.data.homeworks.filter(hw =>
          hw.status === 'GRADED' || hw.status === 'WRONG_ANSWER' || hw.status === 'ACCEPTED'
        );
        break;
      default:
        filtered = this.data.homeworks;
    }
    this.setData({
      filteredHomeworks: filtered
    });
  },

  // 查看作业详情
  viewHomeworkDetail: function (e) {
    const homework = e.currentTarget.dataset.homework;
    wx.navigateTo({
      url: `/pages/homeworkDetail/homeworkDetail?id=${homework.id}`
    });
  },

  // 开始做作业
  doHomework: function (e) {
    const homeworkId = e.currentTarget.dataset.id;
    // const isRedo = this.data.currentFilter === 'SUBMITTED' || this.data.currentFilter === 'GRADED';
    const isRedo = true;
    console.log("选择的作业ID:", homeworkId, "重做模式:", isRedo);
    wx.navigateTo({
      url: `/pages/student_mode/myclass/doHomework/doHomework?id=${homeworkId}&isRedo=${isRedo}`
    });
  },

  // 查看成绩
  viewGrade: function (e) {
    const homeworkId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/GRADEDetail/GRADEDetail?id=${homeworkId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.refreshHomeworkList();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 查看提交
  viewSubmission: function (e) {
    const submissionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      // 跳转到新建的详情页，并传递 submission_id
      url: `/pages/student_mode/myclass/homeworkDetail/homeworkDetail?id=${submissionId}`
    });
  },
});