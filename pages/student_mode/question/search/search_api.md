# 题目搜索 (Search) 前后端接口文档

## 1. 获取知识点元数据

### 前端调用

页面加载时获取筛选用的知识点列表 (`fetchMeta`)。

- **接口地址**: `/question/wx/get_problem_meta_data/`
- **请求方法**: `GET`

### 后端接口

**响应数据**:
```json
{
  "success": true,
  "data": {
    "knowledgePoints": [
      { "id": 1, "name": "函数" },
      { "id": 2, "name": "几何" }
    ]
  }
}
```

## 2. 搜索题目

### 前端调用

根据关键字或选中的知识点搜索题目 (`doSearch`)。

- **接口地址**: `/question/wx/search/`
- **请求方法**: `GET`

### 后端接口

**请求参数 (Query)**:
| 参数名 | 说明 |
| :--- | :--- |
| keyword | 搜索关键词 (可选) |
| kp_id | 知识点ID (可选) |

**响应数据**:
```json
{
  "success": true,
  "data": [
    { "id": 101, "content": "题目内容...", "type": "选择题" }
  ]
}
```
