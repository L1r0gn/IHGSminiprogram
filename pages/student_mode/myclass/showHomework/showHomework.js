const app = getApp();

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
    loading: true
  },

  onLoad: function (options) {
    console.log('获取到上一个页面的参数', options);
    this.setData({
      'classInfo.name': options.class_name,
      'classInfo.code': options.class_code,
      'classInfo.id': options.class_id,
      'classInfo.createTime': options.class_created_time ? options.class_created_time.substr(0, 10) : '',
      'classInfo.teacher': options.class_teacher,
    });
  },

  onShow: function () {
    this.loadClassData(this.data.classInfo.id);
  },

  loadClassData: function (classId) {
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/show_assignment/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'ClassId': classId,
      },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.data.success) {
          const homeworks = (res.data.data || []).map((hw) => {
            const deadline = new Date(hw.deadline.replace(/-/g, '/'));
            const now = new Date();
            const isOverdue = deadline < now;

            let statusText = '';
            let statusClass = '';

            switch (hw.status) {
              case 'PENDING':
                statusText = isOverdue ? '已截止' : '待完成';
                statusClass = isOverdue ? 'overdue' : 'pending';
                break;
              case 'SUBMITTED':
                statusText = '已提交';
                statusClass = 'submitted';
                break;
              case 'GRADED':
                statusText = '已批改';
                statusClass = 'graded';
                break;
              case 'ACCEPTED':
                statusText = '已完成';
                statusClass = 'accepted';
                break;
              case 'WRONG_ANSWER':
                statusText = '需修改';
                statusClass = 'wrong';
                break;
              default:
                statusText = hw.status || '未知';
                statusClass = 'default';
            }

            return {
              ...hw,
              isOverdue: isOverdue,
              statusText: statusText,
              statusClass: statusClass,
              deadlineFormatted: hw.deadline
            };
          });

          this.setData({
            homeworks: homeworks,
            loading: false
          });
          this.filterHomeworks(this.data.currentFilter);
        }
      },
      fail: (err) => {
        console.error('加载班级数据失败:', err);
        this.setData({ loading: false });
      }
    });
  },

  switchFilter: function (e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterHomeworks(filter);
  },

  filterHomeworks: function (filter) {
    let filtered = [];

    switch (filter) {
      case 'all':
        filtered = this.data.homeworks;
        break;
      case 'PENDING':
        filtered = this.data.homeworks.filter(hw => hw.status === 'PENDING');
        break;
      case 'SUBMITTED':
        filtered = this.data.homeworks.filter(hw =>
          hw.status === 'SUBMITTED' || hw.status === 'WRONG_ANSWER' || hw.status === 'ACCEPTED'
        );
        break;
      case 'GRADED':
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

  viewHomeworkDetail: function (e) {
    const homework = e.currentTarget.dataset.homework;
    wx.navigateTo({
      url: `/pages/homework/homework?id=${homework.id}&mode=view`
    });
  },

  doHomework: function (e) {
    const homeworkId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homework/homework?id=${homeworkId}&mode=do`
    });
  },

  viewGrade: function (e) {
    const submissionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homework/homework?id=${submissionId}&mode=grade`
    });
  },

  viewSubmission: function (e) {
    const submissionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homework/homework?id=${submissionId}&mode=grade`
    });
  },

  stopPropagation: function () {
    // 阻止事件冒泡，避免触发卡片的点击事件
  },

  onPullDownRefresh: function () {
    this.loadClassData(this.data.classInfo.id);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});
