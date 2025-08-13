// pages/question/show/show.js
Page({
  data: {
    questionContent: '以下哪个选项是正确的？',
    optionA: '答案 A',
    optionB: '答案 B',
    optionC: '答案 C',
    optionD: '答案 D',
    selectedAnswer: '', // 用户选择的答案
  },

  // 处理答案选择变化
  onAnswerChange(e) {
    this.setData({
      selectedAnswer: e.detail.value
    });
  },

  // 提交答案
  submitAnswer() {
    const { selectedAnswer } = this.data;
    if (selectedAnswer) {
      wx.showToast({
        title: `你选择了: ${selectedAnswer}`,
        icon: 'success',
      });
    } else {
      wx.showToast({
        title: '请选择一个答案',
        icon: 'none',
      });
    }
  }
});
