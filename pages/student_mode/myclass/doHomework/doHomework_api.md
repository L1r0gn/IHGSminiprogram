# 做作业 (DoHomework) 前后端接口文档

## 1. 获取学生作业详情

### 前端调用

页面加载时获取作业题目及状态 (`loadHomeworkDetail`)。

- **接口地址**: `/assignment/wx/get_student_homework_detail/{assignmentId}/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "data": {
    "id": 1,
    "problem_type": "选择",
    "content": "...",
    "student_answer_content": "A", // 上次保存的答案
    "assignment_status_id": 101,
    "deadline": "2023-12-31"
  }
}
```

## 2. 提交作业

### 前端调用

学生提交作业答案 (`performSubmit`)。

- **接口地址**: `/assignment/wx/homeworkGradingProcess/{assignmentId}/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| answer_content | string | 答案内容 (文本或图片路径) |
| is_redo | boolean | 是否为重做 (可选) |

**响应数据**:
```json
{
  "success": true,
  "message": "提交成功"
}
```
