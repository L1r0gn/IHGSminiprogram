// pages/question/search/search.js
const app = getApp();

Page({
  data: {
    keyword: '',
    knowledgePoints: [], // 知识点列表
    selectedKp: null,    // 当前选中的知识点对象
    questionList: [],
    loading: false
  },

  onLoad() {
    this.fetchMeta(); // 获取知识点元数据
    this.doSearch();  // 默认加载一些题目
  },

  // 获取知识点列表（复用你之前的 meta 接口）
  fetchMeta() {
    const token = wx.getStorageSync('accessToken');
    if(!token) return;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/get_problem_meta_data/`,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success && res.data.data.knowledgePoints) {
          // 在列表头部加一个“全部”选项
          const kps = [{id: '', name: '全部知识点'}, ...res.data.data.knowledgePoints];
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
    
    // 如果选的是“全部”，则置空
    this.setData({ 
      selectedKp: kp.id ? kp : null 
    }, () => {
      this.doSearch();
    });
  },

  // 执行搜索
  onSearch() {
    this.doSearch();
  },

  doSearch() {
    const token = wx.getStorageSync('accessToken');
    if (!token) return;

    this.setData({ loading: true });
    
    const params = {};
    if (this.data.keyword) params.keyword = this.data.keyword;
    if (this.data.selectedKp) params.kp_id = this.data.selectedKp.id;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/search/`,
      data: params,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success) {
          this.setData({ questionList: res.data.data });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 跳转到题目详情页
  goToQuestion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/student_mode/question/show/show?id=${id}` // 带ID跳转
    });
  },

  // 跳转随机练习
  goToRandomPractice() {
    wx.navigateTo({
      url: '/pages/student_mode/question/show/show' // 不带ID，默认为随机
    });
  }
});