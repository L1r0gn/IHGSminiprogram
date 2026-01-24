# 班级作业管理 (ClassHomeworkManagement) 前后端接口文档

## 1. 获取班级作业列表 (教师端)

### 前端调用

页面加载时获取该班级布置的所有作业 (`fetchHomeworkList`)。

- **接口地址**: `/assignment/wx/teacher_get_assignments/{classId}`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**响应数据**:
```json
{
  "data": [
    {
      "id": 101,
      "title": "作业标题",
      "created_at": "2023-01-01",
      "status": "PUBLISHED"
    }
  ]
}
```
