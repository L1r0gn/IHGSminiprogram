// pages/question/show/show.js
const katex = require('katex');
Page({
  data: {
    questionContent: '1、改革开放以来，我国新出现的社会阶层属于______',
    resolvedQuestionContent: '',
    options: [{
        id: 'A',
        selected: false
      },
      {
        id: 'B',
        selected: false
      },
      {
        id: 'C',
        selected: false
      },
      {
        id: 'D',
        selected: false
      }
    ],
    selectedAnswer: '', // 存储用户选择的选项ID
    questionId: 1,
    problem_type: '选择', // 题目类型, 默认为 '选择' (选择题)
    submitted_image_path: '', // 存储用户上传的图片路径
    submitted_text: '',
  },

  // 加载过程中获取题目信息
  onLoad() {
    this.getRandomQuestion();
  },
  // 随机跳题
  getRandomQuestion() {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    this.setData({selectedAnswer:''})
    const newOptions = this.data.options.map(item => ({
      ...item,
      selected: false
    }));
    this.setData({
      options: newOptions
    });
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500,
        complete: () => {
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      });
      return; // 终止函数执行
    }
    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/detail/random/`,
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
        if (res.data && res.data.question) {
          console.log('收到的题目信息：',res.data);
          const question = res.data.question;
          // 解析 LaTeX 内容
          const latexHtml = this.parseLatexContent(question.content);
          this.setData({
            resolvedQuestionContent: latexHtml,
            questionContent: question.content,
            questionId: question.id || 1,
            problem_type:res.data.question.problem_type,
          });
          console.log('该题数据为',this.data);
        } else {
          // 显示后端返回的错误信息，或者通用提示
          const errorMsg = res.data.error || '题库已空';
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('该问题信息请求失败', err);
        wx.showToast({
          title: '请求失败，请检查网络',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  // 解析 LaTeX 内容
  parseLatexContent(content) {
    let processedContent = content;
    // 逐步修复各种转义问题
    let step1 = processedContent.replace(/\\\\/g, '\\');
    let step2 = step1.replace(/\\log/g, '\\log');
    let step3 = step2.replace(/_{/g, '_{');
    processedContent = step3;
    let html = processedContent;
    let formulaCount = 0;
    html = html.replace(/\$(.*?)\$/g, (match, formula) => {
      formulaCount++;
      let processedFormula = formula.trim();
      if (processedFormula.includes('log')) {
        let logFormula = processedFormula;
        if (!logFormula.includes('\\log')) {
          logFormula = logFormula.replace(/log/g, '\\log');
        }
        try {
          let result = katex.renderToString(logFormula, {
            throwOnError: false,
            displayMode: false
          });
          return result;
        } catch (error) {
          console.error('对数公式解析失败:', error);
        }
      }
      try {
        let result = katex.renderToString(processedFormula, {
          throwOnError: false,
          displayMode: false
        });
        return result;
      } catch (error) {
        console.error('公式解析失败:', error);
        return match;
      }
    });
    // console.log(`\n=== 解析完成 ===`);
    // console.log('共处理公式:', formulaCount);
    // console.log('最终结果:', html);
    return html;
  },
  printPageData() {
    console.log(this.data);
  },
  // 点击选项时触发
  submitAnswer() {
    const token = wx.getStorageSync('accessToken');
    const userId = wx.getStorageSync('userId'); // **获取 userId**

    if (!token || !userId) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    if (this.data.problem_type === '选择') {
      this.submitChoiceAnswer(token, userId);
    } else {
      this.submitSubjectiveAnswer(token, userId);
    }
  },
  submitChoiceAnswer(token, userId) {
    if (!this.data.selectedAnswer) {
      wx.showToast({ title: '请先选择答案', icon: 'none' });
      return;
    }
    const app = getApp();
    wx.request({
      url: `${app.globalData.globalUrl}/grading/wx/submit/`, // 假设这是你的提交URL
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // 显式声明 Content-Type
      },
      data: {
        questionId: this.data.questionId,
        selectedAnswer: this.data.selectedAnswer,
        submitted_text: this.data.submitted_text, // 如果有文本输入也一并提交
        userId: userId, // **后端需要 userId**
      },
      success: this.handleSubmitSuccess,
      fail: this.handleSubmitFail
    });
  },
  submitSubjectiveAnswer(token, userId) {
    if (!this.data.submitted_image_path) {
      wx.showToast({ title: '请先上传答案图片', icon: 'none' });
      return;
    }
    const app = getApp();
    wx.uploadFile({
      url: `${app.globalData.globalUrl}/grading/wx/submit/`, // 假设这是你的提交URL
      filePath: this.data.submitted_image_path,
      name: 'submitted_image', // **这个 key 需要与你后端 request.FILES.get('key') 中的 key 一致**
      header: { 'Authorization': `Bearer ${token}` },
      formData: {
        questionId: this.data.questionId,
        userId: userId, // **后端需要 userId**
      },
      success: (res) => {
        // wx.uploadFile 返回的 res.data 是字符串，需要手动解析
        try {
            const parsedData = JSON.parse(res.data);
            const syntheticRes = { statusCode: res.statusCode, data: parsedData };
            this.handleSubmitSuccess(syntheticRes);
        } catch (e) {
            // 如果JSON解析失败，说明后端可能返回了非JSON格式的错误
            const syntheticRes = { statusCode: res.statusCode, data: { error: '服务器返回格式错误' } };
            this.handleSubmitSuccess(syntheticRes);
        }
      },
      fail: this.handleSubmitFail
    });
  },
  handleSubmitSuccess(res) {
    if (res.statusCode === 401) {
      wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
      wx.removeStorageSync('accessToken');
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      wx.showToast({ title: '已提交,正在批改', icon: 'success' });
      setTimeout(() => { this.getRandomQuestion(); }, 1500);
    } else {
      const errorMsg = (res.data && res.data.error) ? res.data.error : '提交失败';
      wx.showToast({ title: errorMsg, icon: 'none' });
    }
  },
  handleSubmitFail(err) {
    console.error('提交答案失败', err);
    wx.showToast({ title: '提交失败，请检查网络', icon: 'none' });
  },
  uploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        this.setData({
          submitted_image_path: res.tempFiles[0].tempFilePath
        });
      }
    })
  },
});