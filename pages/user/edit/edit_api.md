# 编辑资料页 (Edit) 前后端接口文档

## 1. 获取编辑页初始化数据

### 前端调用

页面加载 (`onLoad`) 时，获取当前用户信息以及可供选择的班级列表。

- **接口地址**: `/user/wx/edit/{userId}`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**响应数据 (Response)**:

```json
{
  "user": {
    "id": 123,
    "gender": 0,
    "user_attribute": 0,
    "class_in": { "id": 1, "name": "高三1班" },
    "phone": "...",
    "wx_nickName": "...",
    "wx_avatar": "..."
  },
  "classNameList": [
    { "id": 1, "name": "高三1班" },
    { "id": 2, "name": "高三2班" }
  ]
}
```

## 2. 保存用户资料

### 前端调用

用户修改资料后点击保存按钮 (`saveToServer`)。

- **接口地址**: `/user/wx/edit/{userId}`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| gender | integer | 性别索引 (0:男, 1:女) |
| attribute | integer | 身份索引 (0:学生, 1:教师) |
| phone | string | 手机号 |
| nickName | string | 昵称 |
| avatarUrl | string | 头像URL |

**响应数据**:
- 200: 保存成功
- 401: 未授权

## 3. 创建新班级

### 前端调用

用户在弹窗中输入班级名称并确认 (`createNewClass`)。

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
  "class": {
    "id": 101,
    "name": "新班级"
  }
}
```
