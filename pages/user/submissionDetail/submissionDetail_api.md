# 提交详情 (SubmissionDetail) 前后端接口文档

## 1. 获取提交记录详情

### 前端调用

页面加载时根据 ID 获取某次提交的详细信息 (`fetchSubmissionDetail`)。

- **接口地址**: `/grading/wx/submissions/{submissionId}/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "id": 1,
  "question_title": "题目标题",
  "user_answer": "用户答案",
  "status": "ACCEPTED",
  "is_correct": true,
  "feedback": "老师评语或系统反馈",
  "submitted_image": "http://..." // 如果是图片题
}
```
