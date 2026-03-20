// pages/teacher_mode/selectQuestions/selectQuestions.js
const app = getApp();

Page({
  data: {
    keyword: '',
    knowledgePoints: [], // 知识点列表
    selectedKp: null,    // 当前选中的知识点对象
    questionList: [],
    loading: false,
    selectedQuestions: [], // 选中的题目对象列表
    class_id: '',
    page: 1,
    pageSize: 20,
    hasMore: true,
    total: 0
  },

  onLoad(options) {
    if (options.class_id) {
      this.setData({ class_id: options.class_id });
    }
    this.fetchMeta(); // 获取知识点元数据
    this.doSearch();  // 默认加载一些题目
  },

  // 获取知识点列表
  fetchMeta() {
    const token = wx.getStorageSync('accessToken');
    if (!token) return;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/get_problem_meta_data/`,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success && res.data.data.knowledgePoints) {
          const kps = [{ id: '', name: '全部知识点' }, ...res.data.data.knowledgePoints];
          this.setData({ knowledgePoints: kps });
        }
      }
    });
  },

  // 输入监听
  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 清空搜索
  clearKeyword() {
    this.setData({ keyword: '' });
    this.doSearch();
  },

  // 知识点选择变化
  onKpChange(e) {
    const index = e.detail.value;
    const kp = this.data.knowledgePoints[index];

    this.setData({
      selectedKp: kp.id ? kp : null,
      page: 1,
      questionList: []
    }, () => {
      this.doSearch();
    });
  },

  // 执行搜索
  onSearch() {
    this.setData({
      page: 1,
      questionList: []
    });
    this.doSearch();
  },

  doSearch() {
    const token = wx.getStorageSync('accessToken');
    if (!token) return;

    this.setData({ loading: true });

    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize
    };
    if (this.data.keyword) params.keyword = this.data.keyword;
    if (this.data.selectedKp) params.kp_id = this.data.selectedKp.id;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/search/`,
      data: params,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success) {
          // 搜索结果返回后，需要标记已选中的题目
          const list = res.data.data.map(item => {
            return {
              ...item,
              checked: this.data.selectedQuestions.some(sq => sq.id === item.id)
            };
          });

          // 如果是第一页，替换列表；否则追加
          const newList = this.data.page === 1 ? list : [...this.data.questionList, ...list];

          this.setData({
            questionList: newList,
            total: res.data.total || 0,
            hasMore: newList.length < (res.data.total || 0)
          });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({
      page: this.data.page + 1
    }, () => {
      this.doSearch();
    });
  },

  // 切换题目选中状态
  toggleSelection(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.questionList.findIndex(q => q.id === id);
    if (index === -1) return;

    const item = this.data.questionList[index];
    const newChecked = !item.checked;

    // 更新列表显示
    const key = `questionList[${index}].checked`;
    this.setData({ [key]: newChecked });

    // 更新选中对象列表
    let newSelected = [...this.data.selectedQuestions];
    if (newChecked) {
      // 保存题目基本信息
      newSelected.push(item);
    } else {
      newSelected = newSelected.filter(sq => sq.id !== id);
    }
    this.setData({ selectedQuestions: newSelected });
  },

  // 跳转到题目详情页（预览）
  goToQuestion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/teacher_mode/questionDetail/questionDetail?id=${id}` // 跳转到教师专用详情页
    });
  },

  // 下一步：去配置作业
  onNext() {
    if (this.data.selectedQuestions.length === 0) {
      wx.showToast({ title: '请至少选择一道题目', icon: 'none' });
      return;
    }

    // 传递选中ID和班级ID
    wx.setStorageSync('temp_selected_questions', this.data.selectedQuestions);

    wx.navigateTo({
      url: `/pages/teacher_mode/batchAssign/batchAssign?class_id=${this.data.class_id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      questionList: []
    });
    this.doSearch();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMore();
  }
});
