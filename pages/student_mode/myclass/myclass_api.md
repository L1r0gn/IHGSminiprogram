# 我的班级 (MyClass) 前后端接口文档

## 1. 获取已加入的班级

### 前端调用

页面加载或下拉刷新时调用 (`fetchJoinedClasses`)。

- **接口地址**: `/user/wx/list/{userId}/`
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
    "class_in": [
      { "id": 1, "name": "班级名称", "code": "班级码" }
    ]
  }
}
```

## 2. 加入班级

### 前端调用

用户输入班级码后点击加入 (`joinClass`)。

- **接口地址**: `/user/wx/userJoinClass/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| class_code | string | 班级邀请码 |
| user_id | integer | 用户ID |

**响应数据**:
- 200: 加入成功
- 400: 班级码错误
