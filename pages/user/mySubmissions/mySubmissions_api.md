# 提交记录 (MySubmissions) 前后端接口文档

## 1. 获取提交记录列表

### 前端调用

页面加载或上拉/下拉时获取用户的做题记录 (`fetchSubmissions`)。

- **接口地址**: `/grading/wx/submissions/`
- **请求方法**: `GET`

### 后端接口

**请求参数 (Query)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| page | integer | 页码 |
| limit | integer | 每页数量 |
| user_id | integer | 用户ID |
| sort_by | string | 排序方式 (默认 created_at:desc) |

**响应数据**:
```json
{
  "data": [
    {
      "record_id": 1,
      "question_title": "题目A",
      "status": "ACCEPTED",
      "created_at": "2023-01-01"
    }
  ],
  "has_more": true
}
```
