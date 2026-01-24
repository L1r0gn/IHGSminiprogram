# 作业列表 (ShowHomework) 前后端接口文档

## 1. 获取班级作业列表

### 前端调用

页面加载或刷新时获取该班级的作业列表 (`loadClassData`)。

- **接口地址**: `/assignment/wx/show_assignment/`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |
| ClassId | 是 | 班级ID |

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "作业1",
      "status": "PENDING"
    }
  ]
}
```
