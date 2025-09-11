// pages/question/show/show.js
const katex = require('katex');
Page({
  data: {
    questionContent: '1、改革开放以来，我国新出现的社会阶层属于______',
    resolvedQuestionContent: '' ,
    options: [
      { id: 'A', selected: false },
      { id: 'B', selected: false }, 
      { id: 'C', selected: false },
      { id: 'D', selected: false }
    ],
    selectedAnswer: '', // 存储用户选择的选项ID
    questionId: 1
  },

  // 加载过程中获取题目信息
  onLoad() {
    const app = getApp();
    wx.request({
      url: `${app.globalData.globalUrl}/question/wx/detail/random/`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.question) {
          const question = res.data.question;
          // 解析 LaTeX 内容
          const latexHtml = this.parseLatexContent(question.content);
          this.setData({
            resolvedQuestionContent: latexHtml,
            questionContent: question.content,
            questionId: question.id || 1
          });
        }
      },
      fail: (err) => {
        console.error('该问题信息请求失败', err);
        wx.showToast({
          title: '请求失败，请检查网络设置',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
// 解析 LaTeX 内容
// 解析 LaTeX 内容（详细调试版）
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
  console.log(`\n=== 解析完成 ===`);
  console.log('共处理公式:', formulaCount);
  console.log('最终结果:', html);
  
  return html;
},
  // 点击选项时触发
  selectAnswer(e) {
    const selectedId = e.currentTarget.dataset.id;
    const updatedOptions = this.data.options.map(option => ({
      ...option,
      selected: option.id === selectedId
    }));

    this.setData({
      options: updatedOptions,
      selectedAnswer: selectedId
    });
  },

  // 提交答案
  submitAnswer() {
    if (!this.data.selectedAnswer) {
      wx.showToast({
        title: '请先选择答案',
        icon: 'none'
      });
      return;
    }
    wx.showToast({
      title: `已提交: 选项${this.data.selectedAnswer}`,
      icon: 'success'
    });
    // 后续逻辑，如跳转到下一题或结果页
  }
})
