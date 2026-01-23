// pages/teacher_mode/homeworkDetail/homeworkDetail.js
Page({
  data: {
    assignment_id: '',
    class_id:'',
    homeworkDetail: {
      title: '二次函数练习题(测试)',
      subject: '数学',
      deadline: '2023-11-30 23:59',
      created_at: '2023-11-15 10:30',
      description: '完成课本第35页至第38页的所有练习题，重点掌握二次函数的图像和性质。注意解题步骤要完整，书写要规范。',
      status: '进行中'
    },
    submitStats: {
      submittedCount: 28,
      totalCount: 40
    },
    studentList: [],
    filteredStudentList: [],
    currentFilter: "all"
  },

  onLoad: function(options) {
    const assignment_id = options.assignment_id;
    const class_id = options.class_id;
    this.setData({
      assignment_id: assignment_id,
      class_id:class_id,
    });
    // 根据作业ID获取作业详情
    this.getHomeworkDetail(assignment_id);
    // 获取学生列表
    this.getStudentList(assignment_id);
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '作业详情'
    });
    // wx.startPullDownRefresh();
  },

  // 获取作业详情
  getHomeworkDetail: function(assignment_id) {
    // 模拟API调用
    // 实际开发中替换为真实的API调用
    console.log('获取作业详情，作业ID:', assignment_id);
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/teacher_get_assignments_detail/${this.data.class_id}/${this.data.assignment_id}/`,  
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
          console.log('收到后端数据: ',res.data.data);
          this.setData({
            homeworkDetail: res.data.data,
            'submitStats.submittedCount' : res.data.data.submittedCount,
            'submitStats.totalCount' : res.data.data.totalCount,
          });
        } else {
          wx.showToast({
            title: res.data.message || '数据加载失败',
            icon: 'none'
          });
        }
      },
    })
    // 模拟数据
    const homeworkDetail = {
      title: '二次函数练习题',
      subject: '数学',
      deadline: '2023-11-30 23:59',
      created_at: '2023-11-15 10:30',
      description: '完成课本第35页至第38页的所有练习题，重点掌握二次函数的图像和性质。注意解题步骤要完整，书写要规范。',
      status: '进行中'
    };
    this.setData({
      homeworkDetail: homeworkDetail
    });
  },
  // 获取学生列表
  getStudentList: function(assignment_id) {
    // 模拟API调用
    console.log('获取学生列表，作业ID:', assignment_id);
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    wx.request({
      url: `${app.globalData.globalUrl}/assignment/wx/teacher_get_students_assignments_list/${this.data.class_id}/${this.data.assignment_id}/`,  
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
          console.log('收到后端数据: ',res.data.data);
          this.setData({
            studentList: res.data.data,
            filteredStudentList: res.data.data,
          });
        } else {
          wx.showToast({
            title: res.data.message || '数据加载失败',
            icon: 'none'
          });
        }
      },
    })
    // 模拟数据
    // const studentList = [
    //   { id: 1, name: '张三', studentId: '202301001', avatar: '', submitted: true, submitTime: '2023-11-25 14:30' },
    //   { id: 2, name: '李四', studentId: '202301002', avatar: '', submitted: true, submitTime: '2023-11-26 09:15' },
    //   { id: 3, name: '王五', studentId: '202301003', avatar: '', submitted: false },
    //   { id: 4, name: '赵六', studentId: '202301004', avatar: '', submitted: true, submitTime: '2023-11-27 16:45' },
    //   { id: 5, name: '钱七', studentId: '202301005', avatar: '', submitted: false },
    //   // 更多学生数据...
    // ];
  },
  // 切换筛选条件
  changeFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    
    let filteredList = [];
    if (filter === 'all') {
      filteredList = this.data.studentList;
    } else if (filter === 'submitted') {
      filteredList = this.data.studentList.filter(item => item.submitted);
    } else if (filter === 'unsubmitted') {
      filteredList = this.data.studentList.filter(item => !item.submitted);
    }
    
    this.setData({
      filteredStudentList: filteredList
    });
  },

  // 获取已提交学生数量
  getSubmittedCount: function() {
    return this.data.studentList.filter(item => item.submitted).length;
  },

  // 获取未提交学生数量
  getUnsubmittedCount: function() {
    return this.data.studentList.filter(item => !item.submitted).length;
  },

  // 跳转到学生作业详情
  navigateToStudentWork: function(e) {
    const studentId = e.currentTarget.dataset.studentId;
    wx.navigateTo({
      url: `/pages/teacher_mode/studentWork/studentWork?homework_id=${this.data.assignment_id}&student_id=${studentId}`
    });
  },

  // 编辑作业
  editHomework: function() {
    wx.navigateTo({
      url: `/pages/teacher_mode/editHomework/editHomework?homework_id=${this.data.assignment_id}`
    });
  },
  // 发布提醒
  publishReminder: function() {
    wx.showModal({
      title: '发布提醒',
      content: '确定要向未提交作业的学生发送提醒吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用API发送提醒
          console.log('发送提醒给未提交的学生');
          wx.showToast({
            title: '提醒发送成功',
            icon: 'success'
          });
        }
      }
    });
  },
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.getHomeworkDetail(this.data.classId, this.data.homeworkId);
    this.getStudentList(this.data.classId, this.data.homeworkId);
    // 停止下拉刷新
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },
  
})