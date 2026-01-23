// pages/submission-detail/submission-detail.js
Page({
  data: {
    submissionId: null,
    submissionDetail: null,
    loading: true,
    error: null
  },

  onLoad(options) {
    const { submissionId } = options;
    if (submissionId) {
      this.setData({ submissionId });
      this.fetchSubmissionDetail(submissionId);
    } else {
      this.setData({
        loading: false,
        error: '缺少提交记录ID'
      });
    }
  },

  // 获取提交记录详情
  fetchSubmissionDetail(submissionId) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    this.setData({ loading: true, error: null });
    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submissions/${submissionId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if(res.statusCode == 401)
        {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          console.log('收到了submission数据：',res.data);
          this.setData({
            submissionDetail: res.data,
            loading: false
          });
        } else {
          this.setData({
            loading: false,
            error: res.data.error || '获取详情失败'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        this.setData({
          loading: false,
          error: '网络请求失败，请检查网络连接'
        });
      }
    });
  },
  // 重新加载
  onRetry() {
    if (this.data.submissionId) {
      this.fetchSubmissionDetail(this.data.submissionId);
    }
  },
  // 预览图片
  previewImage() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.submitted_image) {
      wx.previewImage({
        urls: [submissionDetail.submitted_image],
        current: submissionDetail.submitted_image
      });
    }
  },

  // 复制反馈信息
  copyFeedback() {
    const { submissionDetail } = this.data;
    if (submissionDetail && submissionDetail.feedback) {
      wx.setClipboardData({
        data: submissionDetail.feedback,
        success: () => {
          wx.showToast({
            title: '反馈已复制',
            icon: 'success'
          });
        }
      });
    }
  }
})