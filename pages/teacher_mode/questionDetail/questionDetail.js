// pages/teacher_mode/questionDetail/questionDetail.js
const katex = require('katex');
const app = getApp();

Page({
  data: {
    questionId: 0,
    questionContent: '',
    resolvedQuestionContent: '',
    resolvedAnswer: '',
    resolvedAnalysis: '',
    problem_type: '',
    difficulty: '',

    // 选项（选择题）
    options: [],

    // 答案
    answer: '', // 参考答案
    analysis: '', // 解析

    isLoading: true
  },

  onLoad(options) {
    if (options.id) {
      this.getQuestionDetail(options.id);
    }
  },

  getQuestionDetail(id) {
    const token = wx.getStorageSync('accessToken');
    if (!token) return;

    this.setData({ isLoading: true });

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
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  renderQuestion(question) {
    const latexHtml = this.parseLatexContent(question.content);

    // 处理选项
    let options = [];
    if (question.problem_type.includes('选择') && question.options) {
      // 假设 options 是 [{key: 'A', value: '...'}, ...]
      // 或者如果是 JSON 字符串需要解析
      if (typeof question.options === 'string') {
        try {
          options = JSON.parse(question.options);
        } catch (e) { }
      } else {
        options = question.options;
      }

      // 处理选项中的 Latex
      options = options.map(opt => {
        return {
          ...opt,
          value: this.parseLatexContent(opt.value)
        };
      });
    }

    this.setData({
      questionId: question.id,
      questionContent: question.content,
      resolvedQuestionContent: latexHtml,
      problem_type: question.problem_type,
      difficulty: question.difficulty,
      answer: question.answer,
      resolvedAnswer: this.parseLatexContent(question.answer || '无'),
      analysis: question.analysis || '暂无解析',
      resolvedAnalysis: this.parseLatexContent(question.analysis || '暂无解析'),
      options: options
    });
  },

  // 复用 Latex 解析逻辑
  parseLatexContent(content) {
    let processedContent = content || '';
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
  }
});
