// utils/bktCalculator.js
// BKT核心计算引擎 - 客户端实现

class BKTCalculator {
  /**
   * BKT更新算法 - 核心计算逻辑
   * @param {number} currentMastery - 当前掌握概率 (0-1)
   * @param {boolean} isCorrect - 答题是否正确
   * @param {Object} parameters - BKT参数对象
   * @returns {number} 更新后的掌握概率
   */
  static updateMasteryProbability(currentMastery, isCorrect, parameters) {
    const { p_T, p_S, p_G } = parameters;
    
    if (isCorrect) {
      // 答题正确的情况
      const numerator = currentMastery * (1 - p_S);
      const denominator = currentMastery * (1 - p_S) + (1 - currentMastery) * p_G;
      return numerator / denominator;
    } else {
      // 答题错误的情况
      const numerator = currentMastery * p_S;
      const denominator = currentMastery * p_S + (1 - currentMastery) * (1 - p_G);
      return numerator / denominator;
    }
  }

  /**
   * 预测下次表现
   * @param {number} masteryProbability - 掌握概率
   * @param {Object} parameters - BKT参数
   * @returns {number} 预测正确率
   */
  static predictNextPerformance(masteryProbability, parameters) {
    const { p_S, p_G } = parameters;
    return masteryProbability * (1 - p_S) + (1 - masteryProbability) * p_G;
  }

  /**
   * 计算学习增益
   * @param {number} oldMastery - 更新前掌握概率
   * @param {number} newMastery - 更新后掌握概率
   * @returns {number} 学习增益值
   */
  static calculateLearningGain(oldMastery, newMastery) {
    return newMastery - oldMastery;
  }

  /**
   * 评估掌握水平等级
   * @param {number} masteryProbability - 掌握概率
   * @returns {string} 掌握等级描述
   */
  static getMasteryLevel(masteryProbability) {
    if (masteryProbability >= 0.9) return '精通';
    if (masteryProbability >= 0.8) return '熟练';
    if (masteryProbability >= 0.6) return '掌握';
    if (masteryProbability >= 0.4) return '基本理解';
    if (masteryProbability >= 0.2) return '初步接触';
    return '未掌握';
  }

  /**
   * 获取掌握等级对应的颜色
   * @param {number} masteryProbability - 掌握概率
   * @returns {string} 颜色值
   */
  static getMasteryColor(masteryProbability) {
    if (masteryProbability >= 0.9) return '#52c41a'; // 绿色 - 精通
    if (masteryProbability >= 0.8) return '#73d13d'; // 浅绿 - 熟练
    if (masteryProbability >= 0.6) return '#ffec3d'; // 黄色 - 掌握
    if (masteryProbability >= 0.4) return '#ffa940'; // 橙色 - 基本理解
    if (masteryProbability >= 0.2) return '#ff4d4f'; // 红色 - 初步接触
    return '#f5222d'; // 深红 - 未掌握
  }

  /**
   * 格式化掌握概率显示
   * @param {number} masteryProbability - 掌握概率
   * @returns {string} 格式化后的显示文本 - example: "90% (精通)"
   */
  static formatMasteryDisplay(masteryProbability) {
    const percentage = Math.round(masteryProbability * 100);
    const level = this.getMasteryLevel(masteryProbability);
    return `${percentage}% (${level})`;
  }

  /**
   * 计算达到目标掌握度需要的答题次数
   * @param {number} currentMastery - 当前掌握概率
   * @param {number} targetMastery - 目标掌握概率
   * @param {Object} parameters - BKT参数
   * @param {number} successRate - 预期正确率
   * @returns {number} 预估需要的答题次数
   */
  static estimateAttemptsNeeded(currentMastery, targetMastery, parameters, successRate = 0.8) {
    if (currentMastery >= targetMastery) return 0;
    
    let attempts = 0;
    let currentProb = currentMastery;
    
    // 模拟答题过程直到达到目标掌握度
    while (currentProb < targetMastery && attempts < 100) { // 防止无限循环
      // 根据预期正确率决定答题结果
      const isCorrect = Math.random() < successRate;
      currentProb = this.updateMasteryProbability(currentProb, isCorrect, parameters);
      attempts++;
    }
    
    return attempts;
  }

  /**
   * 分析学习轨迹趋势
   * @param {Array} learningTraces - 学习轨迹数组
   * @returns {Object} 趋势分析结果
   */
  static analyzeLearningTrend(learningTraces) {
    if (!learningTraces || learningTraces.length === 0) {
      return {
        trend: 'insufficient_data',
        improvement: 0,
        consistency: 0
      };
    }

    // 计算掌握度变化趋势
    const masteryValues = learningTraces.map(trace => trace.mastery_probability || 0);
    const firstMastery = masteryValues[0];
    const lastMastery = masteryValues[masteryValues.length - 1];
    const improvement = lastMastery - firstMastery;

    // 计算稳定性（标准差的倒数）
    const mean = masteryValues.reduce((sum, val) => sum + val, 0) / masteryValues.length;
    const variance = masteryValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / masteryValues.length;
    const consistency = 1 / (1 + Math.sqrt(variance)); // 越稳定越接近1

    // 判断趋势方向
    let trend = 'stable';
    if (improvement > 0.2) trend = 'improving';
    else if (improvement < -0.2) trend = 'declining';
    else if (improvement > 0) trend = 'slightly_improving';
    else if (improvement < 0) trend = 'slightly_declining';

    return {
      trend,
      improvement,
      consistency,
      firstMastery,
      lastMastery,
      totalAttempts: learningTraces.length
    };
  }

  /**
   * 生成学习建议
   * @param {number} masteryProbability - 当前掌握概率
   * @param {Object} trendAnalysis - 趋势分析结果
   * @returns {Array} 建议数组
   */
  static generateLearningSuggestions(masteryProbability, trendAnalysis) {
    const suggestions = [];

    // 基于掌握度的建议
    if (masteryProbability < 0.4) {
      suggestions.push('需要加强基础知识学习');
      suggestions.push('建议从简单题目开始练习');
    } else if (masteryProbability < 0.7) {
      suggestions.push('继续巩固当前知识点');
      suggestions.push('适当增加练习难度');
    } else if (masteryProbability < 0.9) {
      suggestions.push('已经掌握较好，可以挑战更高难度');
    } else {
      suggestions.push('知识点掌握很扎实！');
      suggestions.push('可以尝试综合应用题目');
    }

    // 基于趋势的建议
    if (trendAnalysis.trend.includes('improving')) {
      suggestions.push('学习效果良好，继续保持');
    } else if (trendAnalysis.trend.includes('declining')) {
      suggestions.push('近期表现有所下滑，需要关注');
      suggestions.push('建议回顾基础知识');
    }

    // 基于一致性的建议
    if (trendAnalysis.consistency < 0.6) {
      suggestions.push('答题表现不够稳定，建议规律练习');
    }

    return suggestions;
  }
}

module.exports = BKTCalculator;