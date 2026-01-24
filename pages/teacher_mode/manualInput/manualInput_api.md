# 手动录题 (ManualInput) 前后端接口文档

## 1. 获取题目元数据

### 前端调用

页面加载时获取题目类型、科目、标签等元数据 (`onLoad`)。

- **接口地址**: `/assignment/wx/get_problem_meta_data/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "data": {
    "problemTypes": [{ "id": 1, "name": "选择题" }],
    "subjects": [{ "id": 1, "name": "数学" }],
    "tags": [{ "id": 1, "name": "必修一" }]
  }
}
```

## 2. 发布作业/题目

### 前端调用

教师录入题目信息后提交 (`submitProblem`)。

- **接口地址**: `/assignment/wx/push_assignment/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| title | string | 标题 |
| content | string | 内容 |
| problem_type | integer | 题目类型ID |
| subject | integer | 科目ID |
| class_id | integer | 班级ID |
| status | string | 状态 (published/draft) |
| ... | ... | 其他题目属性 |

**响应数据**:
- 200: 提交成功
