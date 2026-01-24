# 作业详情 (HomeworkDetail) 前后端接口文档

## 1. 获取作业详情 (教师端)

### 前端调用

页面加载时获取特定作业的详细信息 (`getHomeworkDetail`)。

- **接口地址**: `/assignment/wx/teacher_get_assignments_detail/{classId}/{assignmentId}/`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**响应数据**:
```json
{
  "data": {
    "title": "作业标题",
    "subject": "科目",
    "deadline": "2023-12-31",
    "status": "进行中",
    "submittedCount": 10,
    "totalCount": 40
  }
}
```

## 2. 获取学生提交列表

### 前端调用

获取该作业下所有学生的提交状态 (`getStudentList`)。

- **接口地址**: `/assignment/wx/teacher_get_students_assignments_list/{classId}/{assignmentId}/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "张三",
      "submitted": true,
      "submitTime": "2023-12-01"
    }
  ]
}
```
