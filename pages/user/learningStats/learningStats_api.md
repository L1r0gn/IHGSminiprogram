# 学习统计 (LearningStats) 前后端接口文档

## 1. 获取学习统计数据

### 前端调用

页面加载或下拉刷新时获取学生的学习统计信息 (`fetchStats`)。

- **接口地址**: `/question/wx/student/stats/`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**响应数据**:
```json
{
  "success": true,
  "data": {
    "total_questions": 100,
    "avg_mastery": 85.5,
    "stats_list": [
      { "date": "2023-10-01", "count": 10 },
      { "date": "2023-10-02", "count": 5 }
    ]
  }
}
```
