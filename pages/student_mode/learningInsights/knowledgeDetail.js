// pages/student_mode/learningInsights/knowledgeDetail.js
// 知识点详情页面

const bktService = require('../../../utils/bktService.js');

Page({
  data: {
    knowledgePointId: null,
    knowledgePointName: '',
    isLoading: true,
    learningTraces: [],
    bktParameters: null,
    chartData: null,
    // 添加计算好的显示字段
    currentMasteryPercent: '0.0',
    totalAttempts: 0,
    correctRate: '0.0',
    masteryLevel: '未知',
    formattedParams: {
      p_L0: '0.0',
      p_T: '0.0',
      p_G: '0.0',
      p_S: '0.0'
    }
  },

  onLoad: function(options) {
    const { knowledgePointId, knowledgePointName } = options;
    
    if (!knowledgePointId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({
      knowledgePointId,
      knowledgePointName: knowledgePointName || '未知知识点'
    });

    this.loadData();
  },

  // 加载数据
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      const studentId = wx.getStorageSync('userId');
      const knowledgePointId = this.data.knowledgePointId;
      
      // 并行获取学习轨迹和参数 - 后端已经处理好所有格式化
      const [tracesData, paramsData] = await Promise.all([
        bktService.getLearningTraces(studentId, knowledgePointId),
        bktService.getKnowledgePointParameters(knowledgePointId)
      ]);

      console.log('后端返回的完整轨迹数据:', tracesData);
      console.log('后端返回的完整参数数据:', paramsData);

      // 处理学习轨迹数据 - 添加格式化的显示字段
      const processedTraces = (tracesData || []).map(trace => ({
        ...trace,
        formatted_mastery_before: (trace.predicted_mastery_before * 100).toFixed(1),
        formatted_mastery_after: (trace.predicted_mastery_after * 100).toFixed(1),
        outcome_text: trace.outcome === 'CORRECT' ? '正确' : '错误',
        outcome_icon: trace.outcome === 'CORRECT' ? '✅' : '❌'
      }));

      // 计算统计数据
      const totalAttempts = processedTraces.length;
      const correctCount = processedTraces.filter(t => t.outcome === 'CORRECT').length;
      const correctRate = totalAttempts > 0 ? ((correctCount / totalAttempts) * 100).toFixed(1) : '0.0';
      const currentMastery = processedTraces.length > 0 ? processedTraces[processedTraces.length - 1].predicted_mastery_after : 0;
      const currentMasteryPercent = (currentMastery * 100).toFixed(1);
      const masteryLevel = processedTraces.length > 0 ? (processedTraces[processedTraces.length - 1].mastery_level || '未知') : '未知';

      // 格式化BKT参数
      const formattedParams = {
        p_L0: paramsData?.bkt_parameters?.p_L0 ? (paramsData.bkt_parameters.p_L0 * 100).toFixed(1) : '0.0',
        p_T: paramsData?.bkt_parameters?.p_T ? (paramsData.bkt_parameters.p_T * 100).toFixed(1) : '0.0',
        p_G: paramsData?.bkt_parameters?.p_G ? (paramsData.bkt_parameters.p_G * 100).toFixed(1) : '0.0',
        p_S: paramsData?.bkt_parameters?.p_S ? (paramsData.bkt_parameters.p_S * 100).toFixed(1) : '0.0'
      };

      // 直接设置后端返回的数据和计算好的显示字段
      this.setData({
        learningTraces: processedTraces,
        bktParameters: paramsData || {},
        chartData: processedTraces.map(trace => ({
          time: trace.formatted_time || trace.attempt_time,
          mastery: trace.predicted_mastery_after
        })),
        currentMasteryPercent,
        totalAttempts,
        correctRate,
        masteryLevel,
        formattedParams
      });

    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },


  // 查看参数详情 (后端返回的已经是格式化好的)
  viewParameters: function() {
    const params = this.data.bktParameters;
    if (!params || !params.bkt_parameters) {
      wx.showToast({ title: '暂无参数数据', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: 'BKT参数详情',
      content: JSON.stringify(params.bkt_parameters, null, 2),
      showCancel: false
    });
  },

  // 生成学习建议 (后端返回的数据中已包含建议,直接显示)
  generateStudyAdvice: function() {
    const traces = this.data.learningTraces;
    if (!traces || traces.length === 0) {
      wx.showToast({ title: '暂无学习数据', icon: 'none' });
      return;
    }

    // 后端返回的建议字段
    const advice = traces[traces.length - 1].suggestions || ['继续保持学习'];
    
    wx.showModal({
      title: '学习建议',
      content: Array.isArray(advice) ? advice.join('\n\n') : '继续保持学习',
      showCancel: false
    });
  },

  // 预测下次表现 (后端已经计算好,直接使用)
  predictNext: function() {
    const traces = this.data.learningTraces;
    if (!traces || traces.length === 0) {
      wx.showToast({ title: '暂无学习数据', icon: 'none' });
      return;
    }
    
    const lastTrace = traces[traces.length - 1];
    const predicted = lastTrace.predicted_performance || lastTrace.predicted_mastery_after;
    
    wx.showToast({
      title: `预测正确率: ${(predicted * 100).toFixed(1)}%`,
      icon: 'none'
    });
  }
});