# 班级管理 (ClassManage) 前后端接口文档

## 1. 获取班级列表

### 前端调用

页面加载 (`onLoad`) 或下拉刷新 (`onPullDownRefresh`) 时，获取当前用户相关的班级列表。

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
  "code": 200,
  "data": {
    "class_in": [
      { "id": 1, "name": "班级A" },
      { "id": 2, "name": "班级B" }
    ]
  }
}
```

## 2. 创建班级

### 前端调用

教师用户点击创建班级并输入名称后调用 (`createClass`)。

- **接口地址**: `/class/create/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| name | string | 班级名称 |

**响应数据**:
```json
{
  "success": true,
  "message": "创建成功",
  "user_classes": [ ... ] // 更新后的班级列表
}
```
