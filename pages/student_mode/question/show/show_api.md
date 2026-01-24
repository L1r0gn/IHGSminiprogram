# 题目详情/答题 (Show) 前后端接口文档

## 1. 获取题目详情

### 前端调用

根据题目ID获取详情 (`getSpecificQuestion`)。

- **接口地址**: `/question/wx/detail/{id}/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "success": true,
  "question": {
    "id": 1,
    "content": "题目内容",
    "problem_type": "选择"
  }
}
```

## 2. 获取随机题目

### 前端调用

随机获取一道题目 (`getRandomQuestion`)。

- **接口地址**: `/question/wx/detail/random/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "question": { ... }
}
```

## 3. 提交答案 (选择题)

### 前端调用

提交选择题答案 (`submitChoiceAnswer`)。

- **接口地址**: `/grading/wx/submit/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| questionId | integer | 题目ID |
| selectedAnswer | string | 选项 (A/B/C/D) |
| userId | integer | 用户ID |

**响应数据**:
- 200: 提交成功

## 4. 提交答案 (主观题/图片)

### 前端调用

上传图片作为答案 (`submitSubjectiveAnswer`)。

- **接口地址**: `/grading/wx/submit/`
- **请求方法**: `POST` (Multipart/form-data)

### 后端接口

**请求参数 (FormData)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| submitted_image | file | 图片文件 |
| questionId | integer | 题目ID |
| userId | integer | 用户ID |

**响应数据**:
- 200: 提交成功
