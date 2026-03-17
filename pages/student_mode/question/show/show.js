// pages/question/show/show.js
const katex = require('katex'); // 确保你项目里有这个库
const app = getApp();

Page({
  data: {
    // ... 原有 data ...
    questionContent: '',
    resolvedQuestionContent: '',
    options: [{id: 'A', selected: false}, {id: 'B', selected: false}, {id: 'C', selected: false}, {id: 'D', selected: false}],
    selectedAnswer: '', 
    questionId: 0,
    problem_type: '选择',
    submitted_image_path: '',
    isRandomMode: true // 新增：标记当前是否为随机模式
  },

  onLoad(options) {
    // 检查是否传入了特定题目 ID
    if (options.id) {
      this.setData({ isRandomMode: false });
      this.getSpecificQuestion(options.id);
    } else {
      this.setData({ isRandomMode: true });
      this.getRandomQuestion();
    }
  },

  // 新增：获取指定ID题目
  getSpecificQuestion(id) {
    const token = wx.getStorageSync('accessToken');
    if (!this.checkLogin(token)) return;

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/detail/${id}/`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.success) {
          this.renderQuestion(res.data.question);
        } else {
          wx.showToast({ title: '题目加载失败', icon: 'none' });
        }
      },
      complete: () => wx.hideLoading()
    });
  },

  // 现有：随机跳题
  getRandomQuestion() {
    // 如果是从列表进来的（非随机模式），点击“换一题”应该变成随机模式，或者直接提示用户
    // 这里我们设定：点击换一题，就进入随机模式
    this.setData({ isRandomMode: true });

    const token = wx.getStorageSync('accessToken');
    this.setData({selectedAnswer: '', submitted_image_path: ''}); // 重置状态
    
    // 重置选项UI
    const newOptions = this.data.options.map(item => ({...item, selected: false}));
    this.setData({ options: newOptions });

    if (!this.checkLogin(token)) return;

    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/detail/random/`, // 注意：原接口路径可能是 wx/detail/random/
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.data.question) {
           this.renderQuestion(res.data.question);
        } else {
           wx.showToast({ title: res.data.error || '题库为空', icon: 'none' });
        }
      }
    });
  },

  // 辅助：渲染题目数据（提取公共逻辑）
  renderQuestion(question) {
    const latexHtml = this.parseLatexContent(question.content);
    this.setData({
      resolvedQuestionContent: latexHtml,
      questionContent: question.content,
      questionId: question.id,
      problem_type: question.problem_type,
    });
  },

  // 辅助：检查登录
  checkLogin(token) {
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1500);
      return false;
    }
    return true;
  },

  parseLatexContent(content) {
      // ... 你原有的解析代码 ...
      let processedContent = content || ''; // 防止 null 报错
      // ...
      // 这里直接复制你原来的代码即可，篇幅原因略过
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
      return html;
  },
  
  // 选项点击逻辑保持不变
  selectAnswer(e) {
      const id = e.currentTarget.dataset.id;
      const newOptions = this.data.options.map(item => ({
        ...item,
        selected: item.id === id
      }));
      this.setData({
        options: newOptions,
        selectedAnswer: id
      });
  },

  handleSubmitSuccess(res) {
    // ... 检查 code ...
    if (res.statusCode >= 200 && res.statusCode < 300) {
      wx.showToast({ title: '提交成功', icon: 'success' });
      
      // 延迟跳转
      setTimeout(() => { 
          // 无论之前是单题模式还是随机模式，提交后都自动进入“下一题”（随机）
          // 或者你可以弹窗询问用户“返回列表”还是“下一题”
          this.getRandomQuestion(); 
      }, 1500);
    } 
    // ...
  },
  
  // 图片上传逻辑保持不变
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
  
  // 提交主逻辑
  /**
   * 提交答案
   * 根据题目类型调用不同的提交方法
   * - 检查用户token和userId，未登录则跳转登录页
   * - 选择题调用submitChoiceAnswer()
   * - 主观题调用submitSubjectiveAnswer()
   */
  submitAnswer() {
      const token = wx.getStorageSync('accessToken');
      const userId = wx.getStorageSync('userId');
  
      if (!token || !userId) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
  
      if (this.data.problem_type === '选择') {
        this.submitChoiceAnswer();
      } else {
        this.submitSubjectiveAnswer();
      }
    },
    
    // 选择题提交
    submitChoiceAnswer() {
      const token = wx.getStorageSync('accessToken');
      const userId = wx.getStorageSync('userId');
        if (!this.data.selectedAnswer) {
          wx.showToast({ title: '请先选择答案', icon: 'none' });
          return;
        }
        const app = getApp();
        const post_data = {
          questionId: this.data.questionId,
          selectedAnswer: this.data.selectedAnswer,
          submitted_text: this.data.submitted_text,
          userId: userId,
        };
        console.log('提交的答案数据：',post_data);
        wx.request({
          url: `${app.globalData.globalUrl}/grading/wx/submit/`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
          },
          data : {
            from:'question',
            ...post_data
          },
          success: (res) => {
            if (res.statusCode === 401) {
              app.handleTokenExpired();
            }
            else
            {
              this.handleSubmitSuccess(res) // 绑定上下文
            } 
          },
          fail: (err) => this.handleSubmitFail(err)
        });
    },

    // 主观题提交
    submitSubjectiveAnswer() {
      const token = wx.getStorageSync('accessToken');
      const userId = wx.getStorageSync('userId');
        if (!this.data.submitted_image_path) {
          wx.showToast({ title: '请先上传答案图片', icon: 'none' });
          return;
        }
        const app = getApp();
        wx.uploadFile({
          url: `${app.globalData.globalUrl}/grading/wx/submit/`,
          filePath: this.data.submitted_image_path,
          name: 'submitted_image', // 注意这里的 key 
          header: {
             'Authorization': `Bearer ${token}`,
          },
          formData: {
            questionId: this.data.questionId,
            userId: userId,
            from:'question',
          },
          success: (res) => {
            try {
                const parsedData = JSON.parse(res.data);
                const syntheticRes = { statusCode: res.statusCode, data: parsedData };
                this.handleSubmitSuccess(syntheticRes);
            } catch (e) {
                const syntheticRes = { statusCode: res.statusCode, data: { error: '服务器返回格式错误' } };
                this.handleSubmitSuccess(syntheticRes);
            }
          },
          fail: (err) => this.handleSubmitFail(err)
        });
    },
    
    handleSubmitFail(err) {
        console.error('提交答案失败', err);
        wx.showToast({ title: '提交失败，请检查网络', icon: 'none' });
    },
});