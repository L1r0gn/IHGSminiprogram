# 用户详情页 (UserList) 前后端接口文档

## 1. 获取用户详细信息

### 前端调用

页面显示 (`onShow`) 时，根据本地存储的 `userId` 获取用户的详细信息进行展示。

- **触发时机**: `onShow` -> `getUserDetail`
- **请求方法**: `wx.request`

### 后端接口

**接口地址**: `/user/wx/list/{userId}/`

**请求方法**: `GET`

**请求头 (Headers)**:
| 字段名 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| Authorization | 是 | JWT Token | `Bearer <access_token>` |

**路径参数 (Path Parameters)**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| userId | integer | 是 | 用户ID | `123` |

**响应数据结构 (Response)**:

- **状态码 200 (成功)**

```json
{
  "code": 200,
  "data": {
    "id": 123,
    "wx_nickName": "用户昵称",
    "wx_avatar": "头像URL",
    "phone": "手机号",
    "gender": 1, // 0: 男, 1: 女
    "user_attribute": 0, // 0: 学生, 1: 教师
    "last_login_time": "2023-01-01"
    // ...
  }
}
```

- **状态码 401 (未授权)**
  - Token 过期。

### 示例代码

```javascript
wx.request({
  url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
  method: 'GET',
  header: {
    'Authorization': `Bearer ${token}`
  },
  success: (res) => {
    // 处理数据展示
  }
});
```
