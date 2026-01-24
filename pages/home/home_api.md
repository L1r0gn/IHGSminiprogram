# 首页 (Home) 前后端接口文档

## 1. 获取用户信息

### 前端调用

在页面显示 (`onShow`) 时，如果本地存储中存在 `userId` 和 `accessToken`，则发起请求获取最新的用户信息。

- **触发时机**: `onShow`
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
  "msg": "success",
  "data": {
    "id": 123,
    "wx_nickName": "微信用户",
    "wx_avatar": "https://...",
    "user_attribute": 0, // 0: 学生, 1: 教师
    "phone": "13800000000",
    "gender": 1,
    "last_login_time": "2023-10-01 12:00:00"
    // ... 其他用户字段
  }
}
```

- **状态码 401 (未授权)**
  - Token 过期或无效，前端需处理重新登录逻辑。

### 示例代码

```javascript
wx.request({
  url: `${app.globalData.globalUrl}/user/wx/list/${userId}/`,
  method: 'GET',
  header: {
    'Authorization': `Bearer ${token}`
  },
  success: (res) => {
    if (res.statusCode === 200) {
      this.setData({
        userInfo: res.data.data
      });
      this.updateView();
    }
  }
});
```
