// mock/bktMockData.js
// BKT模块模拟数据，用于开发和测试

const MockData = {
  // 学生知识画像模拟数据
  getStudentProfile: function(studentId) {
    return {
      student_id: studentId,
      student_name: "张三",
      total_knowledge_points: 15,
      average_mastery: 0.65,
      knowledge_points: [
        {
          knowledge_point_id: 1,
          knowledge_point_name: "一元二次方程",
          mastery_probability: 0.85,
          total_attempts: 12,
          correct_attempts: 10,
          predicted_performance: 0.82,
          last_updated: "2024-01-15T10:30:00Z"
        },
        {
          knowledge_point_id: 2,
          knowledge_point_name: "三角函数",
          mastery_probability: 0.45,
          total_attempts: 8,
          correct_attempts: 3,
          predicted_performance: 0.38,
          last_updated: "2024-01-14T15:20:00Z"
        },
        {
          knowledge_point_id: 3,
          knowledge_point_name: "概率统计",
          mastery_probability: 0.72,
          total_attempts: 15,
          correct_attempts: 11,
          predicted_performance: 0.68,
          last_updated: "2024-01-15T09:15:00Z"
        },
        {
          knowledge_point_id: 4,
          knowledge_point_name: "立体几何",
          mastery_probability: 0.28,
          total_attempts: 6,
          correct_attempts: 1,
          predicted_performance: 0.22,
          last_updated: "2024-01-13T14:45:00Z"
        },
        {
          knowledge_point_id: 5,
          knowledge_point_name: "数列",
          mastery_probability: 0.91,
          total_attempts: 20,
          correct_attempts: 18,
          predicted_performance: 0.89,
          last_updated: "2024-01-15T11:20:00Z"
        }
      ],
      recent_activity: [
        {
          date: "2024-01-15",
          activities: [
            {
              knowledge_point: "一元二次方程",
              outcome: "CORRECT",
              timestamp: "2024-01-15T10:30:00Z"
            },
            {
              knowledge_point: "三角函数", 
              outcome: "INCORRECT",
              timestamp: "2024-01-15T09:45:00Z"
            }
          ]
        }
      ]
    };
  },

  // 知识点参数模拟数据
  getKnowledgePointParameters: function(kpId) {
    const mockParams = {
      1: {
        knowledge_point: {
          id: 1,
          name: "一元二次方程",
          subject: "数学"
        },
        bkt_parameters: {
          p_L0: 0.15,
          p_T: 0.35,
          p_G: 0.18,
          p_S: 0.12,
          decay_factor: 0.95
        },
        training_samples: 156,
        last_trained: "2024-01-10T14:30:00Z"
      },
      2: {
        knowledge_point: {
          id: 2,
          name: "三角函数",
          subject: "数学"
        },
        bkt_parameters: {
          p_L0: 0.12,
          p_T: 0.28,
          p_G: 0.22,
          p_S: 0.15,
          decay_factor: 0.92
        },
        training_samples: 89,
        last_trained: "2024-01-08T16:45:00Z"
      }
    };

    return mockParams[kpId] || mockParams[1]; // 默认返回第一个
  },

  // 学习轨迹模拟数据
  getLearningTraces: function(studentId, knowledgePointId) {
    return [
      {
        id: 1,
        student_id: studentId,
        knowledge_point_id: knowledgePointId,
        outcome: "CORRECT",
        attempt_time: "2024-01-10T09:15:00Z",
        predicted_mastery_before: 0.3,
        predicted_mastery_after: 0.45
      },
      {
        id: 2,
        student_id: studentId,
        knowledge_point_id: knowledgePointId,
        outcome: "INCORRECT",
        attempt_time: "2024-01-11T10:30:00Z",
        predicted_mastery_before: 0.45,
        predicted_mastery_after: 0.38
      },
      {
        id: 3,
        student_id: studentId,
        knowledge_point_id: knowledgePointId,
        outcome: "CORRECT",
        attempt_time: "2024-01-12T14:20:00Z",
        predicted_mastery_before: 0.38,
        predicted_mastery_after: 0.52
      },
      {
        id: 4,
        student_id: studentId,
        knowledge_point_id: knowledgePointId,
        outcome: "CORRECT",
        attempt_time: "2024-01-13T11:45:00Z",
        predicted_mastery_before: 0.52,
        predicted_mastery_after: 0.65
      }
    ];
  },

  // 班级分析模拟数据
  getClassAnalytics: function(classId) {
    return {
      class_id: classId,
      class_name: "高三(1)班",
      subject: "数学",
      knowledge_points: [
        {
          knowledge_point_id: 1,
          knowledge_point_name: "一元二次方程",
          student_count: 45,
          average_mastery: 0.72,
          mastery_std: 0.18,
          proficiency_rate: 0.65,
          distribution: {
            mastered: 29,
            learning: 12,
            struggling: 4
          }
        },
        {
          knowledge_point_id: 2,
          knowledge_point_name: "三角函数",
          student_count: 45,
          average_mastery: 0.55,
          mastery_std: 0.22,
          proficiency_rate: 0.42,
          distribution: {
            mastered: 19,
            learning: 19,
            struggling: 7
          }
        }
      ],
      calculated_at: "2024-01-15T12:00:00Z"
    };
  }
};

module.exports = MockData;