// pages/student_mode/learningInsights/testBKT.js
// BKT功能测试页面 - 测试后端API连接

const bktService = require('../../../utils/bktService.js');

Page({
  data: {
    testResults: [],
    isLoading: false
  },

  onLoad: function() {
    this.runTests();
  },

  // 运行测试 - 测试后端API是否正常工作
  async runTests() {
    this.setData({ isLoading: true });
    const results = [];

    try {
      // 测试1: 获取学生画像API测试
      results.push({
        name: '获取学生画像API测试',
        status: 'running',
        details: '测试后端BKT学生画像接口'
      });

      try {
        const studentId = wx.getStorageSync('userId');
        if (studentId) {
          const profile = await bktService.getStudentProfile(studentId);
          results[0].status = 'success';
          results[0].details = `成功获取 ${profile.total_knowledge_points || 0} 个知识点数据,平均掌握度: ${(profile.average_mastery * 100).toFixed(1)}%`;
        } else {
          results[0].status = 'warning';
          results[0].details = '需要先登录以获取学生ID';
        }
      } catch (error) {
        results[0].status = 'error';
        results[0].details = `API测试失败: ${error.message}`;
      }

      // 测试2: 学习轨迹API测试
      results.push({
        name: '获取学习轨迹API测试',
        status: 'running',
        details: '测试后端学习轨迹接口'
      });

      try {
        const studentId = wx.getStorageSync('userId');
        if (studentId && results[0].status === 'success') {
          const profile = await bktService.getStudentProfile(studentId);
          if (profile.knowledge_points && profile.knowledge_points.length > 0) {
            const kpId = profile.knowledge_points[0].knowledge_point_id;
            const traces = await bktService.getLearningTraces(studentId, kpId);
            results[1].status = 'success';
            results[1].details = `成功获取 ${traces.length || 0} 条学习轨迹记录`;
          } else {
            results[1].status = 'warning';
            results[1].details = '没有知识点数据可供测试';
          }
        } else {
          results[1].status = 'skipped';
          results[1].details = '跳过测试(依赖前置测试成功)';
        }
      } catch (error) {
        results[1].status = 'error';
        results[1].details = `API测试失败: ${error.message}`;
      }

      // 测试3: 知识点参数API测试
      results.push({
        name: '获取知识点参数API测试',
        status: 'running',
        details: '测试后端知识点参数接口'
      });

      try {
        const studentId = wx.getStorageSync('userId');
        if (studentId && results[0].status === 'success') {
          const profile = await bktService.getStudentProfile(studentId);
          if (profile.knowledge_points && profile.knowledge_points.length > 0) {
            const kpId = profile.knowledge_points[0].knowledge_point_id;
            const params = await bktService.getKnowledgePointParameters(kpId);
            results[2].status = 'success';
            results[2].details = `成功获取BKT参数: p_L0=${(params.bkt_parameters?.p_L0 * 100).toFixed(1)}%`;
          } else {
            results[2].status = 'warning';
            results[2].details = '没有知识点数据可供测试';
          }
        } else {
          results[2].status = 'skipped';
          results[2].details = '跳过测试(依赖前置测试成功)';
        }
      } catch (error) {
        results[2].status = 'error';
        results[2].details = `API测试失败: ${error.message}`;
      }

    } catch (error) {
      results.push({
        name: '测试执行错误',
        status: 'error',
        details: error.message
      });
    }

    this.setData({
      testResults: results,
      isLoading: false
    });
  },

  // 重新运行测试
  onRetry: function() {
    this.runTests();
  }
});