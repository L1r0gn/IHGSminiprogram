const app = getApp();

Page({
  data: {
    submissionId: null,
    submission: null, // 存放后端返回的数据
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ submissionId: options.id });
      this.fetchSubmissionDetail(options.id);
    }
  },

  // 获取提交详情
  fetchSubmissionDetail(id) {
    const token = wx.getStorageSync('accessToken');
    
    wx.showLoading({ title: '加载中...' });

    const url = `${app.globalData.globalUrl}/grading/wx/submissions/assignment_id=${id}/`;

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 这里的 res.data 结构对应 views.py 中 getASubmission 返回的 JsonResponse
          this.setData({
            submission: res.data[0],
            loading: false
          });
        } else {
          wx.showToast({ title: '获取失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 图片预览功能
  previewImage() {
    if (this.data.submission && this.data.submission.submitted_image) {
      wx.previewImage({
        urls: [this.data.submission.submitted_image] // 需要数组格式
      });
    }
  }
});