const app = getApp();

Page({
  data: {
    keyword: '',
    knowledgePoints: [],
    selectedKp: null,
    
    showFilterModal: false,
    // 筛选列表（显示文字不变）
    typeList: [
      { key: 'single', text: '选择' },
      { key: 'fill', text: '填空' },
      { key: 'qa', text: '问答' },
      { key: 'multi', text: '多选' }
    ],
    difficultyList: [
      { key: 'easy', text: '简单' },
      { key: 'medium', text: '中等' },
      { key: 'hard', text: '困难' }
    ],
    subjectList: [
      { key: 'chinese', text: '语文' },
      { key: 'math', text: '数学' },
      { key: 'english', text: '英语' },
      { key: 'physics', text: '物理' }
    ],
    // 选中状态（用英文 key）
    selectedType: {},  // { single: true, fill: false }
    selectedDiff: {},  // { easy: false, hard: true }
    selectedSubj: {},  // { math: true, english: false }
    
    questionList: [],
    loading: false
  },

  onLoad() {
    this.initSelectStatus();  
    this.fetchMeta();         
    this.doSearch();          
  },

  // 初始化选中状态（全部 false）
  initSelectStatus() {
    const typeObj = {};
    this.data.typeList.forEach(item => typeObj[item.key] = false);
    
    const diffObj = {};
    this.data.difficultyList.forEach(item => diffObj[item.key] = false);
    
    const subjObj = {};
    this.data.subjectList.forEach(item => subjObj[item.key] = false);
    
    this.setData({
      selectedType: typeObj,
      selectedDiff: diffObj,
      selectedSubj: subjObj
    });
  },

  fetchMeta() {
    const token = wx.getStorageSync('accessToken');
    if(!token) return;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/get_problem_meta_data/`,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success && res.data.data.knowledgePoints) {
          const kps = [{id: '', name: '全部知识点'}, ...res.data.data.knowledgePoints];
          this.setData({ knowledgePoints: kps });
        }
      }
    });
  },

  showFilter() {
    this.setData({ showFilterModal: true });
  },

  hideFilter() {
    this.setData({ showFilterModal: false });
  },

  clearAllFilter() {
    this.initSelectStatus();
    this.setData({
      keyword: '',
      selectedKp: null
    }, () => {
      this.doSearch();
      this.hideFilter();
    });
  },

  // 点击逻辑（用 key 操作）
  onTypeChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      [`selectedType.${key}`]: !this.data.selectedType[key]
    });
  },

  onDifficultyChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      [`selectedDiff.${key}`]: !this.data.selectedDiff[key]
    });
  },

  onSubjectChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      [`selectedSubj.${key}`]: !this.data.selectedSubj[key]
    });
  },

  confirmFilter() {
    this.hideFilter();
    this.doSearch();
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },
  
  clearKeyword() {
    this.setData({ keyword: '' });
    this.doSearch();
  },

  onKpChange(e) {
    const index = e.detail.value;
    const kp = this.data.knowledgePoints[index];
    this.setData({ 
      selectedKp: kp.id ? kp : null 
    }, () => {
      this.doSearch();
    });
  },

  onSearch() {
    this.doSearch();
  },

  doSearch() {
    const token = wx.getStorageSync('accessToken');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
  
    // 1. 组装参数（只传关键词/知识点ID，筛选逻辑放前端）
    const params = {};
    if (this.data.keyword) params.keyword = this.data.keyword;
    if (this.data.selectedKp) params.kp_id = this.data.selectedKp;
  
    console.log("传给后端的参数：", params);
  
    this.setData({ loading: true });
  
    // 2. 发起请求（获取基础数据）
    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/search/`,
      method: 'GET',
      data: params,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        console.log("后端返回数据：", res.data);
        // 打印第一条题目的完整字段
        if (res.data.data && res.data.data.length > 0) {
          console.log("单条题目字段：", JSON.stringify(res.data.data[0], null, 2));
        }
        
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          // 初始化过滤列表
          let filteredList = res.data.data;
          
          // ===== 1. 过滤难度 =====
          const selectedDiffTexts = this.data.difficultyList
            .filter(item => this.data.selectedDiff[item.key])
            .map(item => item.text);
          if (selectedDiffTexts.length > 0) {
            filteredList = filteredList.filter(item => {
              return selectedDiffTexts.includes(item.difficulty);
            });
          }
  
          // ===== 2. 过滤题型 =====
          const selectedTypeTexts = this.data.typeList
            .filter(item => this.data.selectedType[item.key])
            .map(item => item.text);
          if (selectedTypeTexts.length > 0) {
            filteredList = filteredList.filter(item => {
              return selectedTypeTexts.includes(item.problem_type);
            });
          }
  
          // ===== 3. 过滤科目 =====
          const selectedSubjTexts = this.data.subjectList
            .filter(item => this.data.selectedSubj[item.key])
            .map(item => item.text);
          if (selectedSubjTexts.length > 0) {
            filteredList = filteredList.filter(item => {
              return selectedSubjTexts.includes(item.subject);
            });
          }
  
          // 4. 更新列表
          this.setData({
            questionList: filteredList
          }, () => {
            console.log("本地过滤后列表长度：", this.data.questionList.length);
          });
        } else {
          wx.showToast({ title: '无匹配数据', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error("请求失败：", err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  goToQuestion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/student_mode/question/show/show?id=${id}`
    });
  },

  goToRandomPractice() {
    wx.navigateTo({
      url: '/pages/student_mode/question/show/show'
    });
  }
});