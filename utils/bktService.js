// utils/bktService.js
// BKT模块服务类 - 与后端API对接

const app = getApp();

class BKTService {
  constructor() {
    this.baseUrl = app.globalData.globalUrl;
  }

  // 获取请求头
  getHeaders() {
    const token = wx.getStorageSync('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 获取学生知识画像
   * @param {string} studentId - 学生ID
   * @returns {Promise<Object>} 学生知识画像数据
   */
  async getStudentProfile(studentId) {
    try {
      // 手动包装 wx.request 为 Promise
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}/bkt/wx/student/${studentId}/profile/`,
          method: 'GET',
          header: this.getHeaders(),
          success: resolve,
          fail: (err) => reject(new Error('网络请求失败'))
        });
      });
  
      if (response.statusCode === 200) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.error || '获取学生画像失败');
        }
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || `请求失败，状态码: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('获取学生画像失败:', error);
      wx.showToast({
        title: error.message || '获取学生画像失败',
        icon: 'none'
      });
      throw error; // 根据调用方是否需要处理错误决定是否 re-throw
    }
  }

  /**
   * 预测学生表现
   * @param {string} studentId - 学生ID
   * @param {Object} predictionData - 预测数据
   * @returns {Promise<Object>} 预测结果
   */
  async predictStudentPerformance(studentId, predictionData) {
    try {
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/student/${studentId}/prediction/`,
        method: 'POST',
        header: this.getHeaders(),
        data: predictionData
      });

      if (response.statusCode === 200) {
        return response.data;
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '预测学生表现失败');
      }
    } catch (error) {
      console.error('预测学生表现失败:', error);
      throw error;
    }
  }

  /**
   * 获取班级分析数据
   * @param {string} classId - 班级ID
   * @returns {Promise<Object>} 班级分析数据
   */
  async getClassAnalytics(classId) {
    try {
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/class/${classId}/analytics/`,
        method: 'GET',
        header: this.getHeaders()
      });

      if (response.statusCode === 200) {
        return response.data;
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '获取班级分析失败');
      }
    } catch (error) {
      console.error('获取班级分析失败:', error);
      throw error;
    }
  }

  /**
   * 获取知识点参数
   * @param {string} knowledgePointId - 知识点ID
   * @returns {Promise<Object>} 知识点BKT参数
   */
  async getKnowledgePointParameters(knowledgePointId) {
    try {
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/knowledge-point/${knowledgePointId}/parameters/`,
        method: 'GET',
        header: this.getHeaders()
      });

      if (response.statusCode === 200) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.error || '获取知识点参数失败');
        }
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '获取知识点参数失败');
      }
    } catch (error) {
      console.error('获取知识点参数失败:', error);
      throw error;
    }
  }

  /**
   * 处理学习事件
   * @param {Object} eventData - 学习事件数据
   * @returns {Promise<Object>} 处理结果
   */
  async processLearningEvent(eventData) {
    try {
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/process-learning-event/`,
        method: 'POST',
        header: this.getHeaders(),
        data: eventData
      });

      if (response.statusCode === 200) {
        return response.data;
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '处理学习事件失败');
      }
    } catch (error) {
      console.error('处理学习事件失败:', error);
      throw error;
    }
  }

  /**
   * 获取学生知识点掌握状态
   * @param {string} studentId - 学生ID
   * @param {string} knowledgePointId - 知识点ID
   * @returns {Promise<Object>} 掌握状态数据
   */
  async getStudentMasteryState(studentId, knowledgePointId) {
    try {
      // 这个接口可能需要后端添加
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/student/${studentId}/knowledge-point/${knowledgePointId}/state/`,
        method: 'GET',
        header: this.getHeaders()
      });

      if (response.statusCode === 200) {
        return response.data;
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '获取掌握状态失败');
      }
    } catch (error) {
      console.error('获取掌握状态失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取多个知识点的状态
   * @param {string} studentId - 学生ID
   * @param {Array<string>} knowledgePointIds - 知识点ID数组
   * @returns {Promise<Array>} 批量状态数据
   */
  async getBatchMasteryStates(studentId, knowledgePointIds) {
    try {
      const promises = knowledgePointIds.map(kpId => 
        this.getStudentMasteryState(studentId, kpId)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('批量获取掌握状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取学生学习轨迹
   * @param {string} studentId - 学生ID
   * @param {string} knowledgePointId - 知识点ID
   * @returns {Promise<Array>} 学习轨迹数据
   */
  async getLearningTraces(studentId, knowledgePointId) {
    try {
      const response = await wx.request({
        url: `${this.baseUrl}/api/bkt/wx/student/${studentId}/knowledge-point/${knowledgePointId}/traces/`,
        method: 'GET',
        header: this.getHeaders()
      });

      if (response.statusCode === 200) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.error || '获取学习轨迹失败');
        }
      } else if (response.statusCode === 401) {
        app.handleTokenExpired();
        throw new Error('未授权访问');
      } else {
        throw new Error(response.data?.error || '获取学习轨迹失败');
      }
    } catch (error) {
      console.error('获取学习轨迹失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
module.exports = new BKTService();