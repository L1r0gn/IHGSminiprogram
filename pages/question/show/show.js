// pages/question/show/show.js
Page({
  data: {
    questionContent: '1、改革开放以来，我国新出现的社会阶层属于______',
    options: [
      { id: 'A', content: '中国特色社会主义事业的建设者', selected: true },
      { id: 'B', content: '社会主义劳动者', selected: false }, 
      { id: 'C', content: '劳动人民的一部分', selected: false },
      { id: 'D', content: '工人阶级的一部分', selected: false }
    ],
    selectedAnswer: '', // 存储用户选择的选项ID
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
    
    // 这里可以添加后续逻辑，如跳转到下一题或结果页
  }
})