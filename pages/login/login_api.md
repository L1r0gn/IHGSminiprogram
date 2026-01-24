# 登录页 (Login) 前后端接口文档

## 1. 微信登录

### 前端调用

用户点击登录按钮后，前端调用 `wx.login` 获取 `code`，并将 `code` 以及用户填写的昵称和头像 URL 发送到后端进行验证和注册/登录。

- **触发时机**: 点击“登录”按钮 (`loginToServer`)
- **请求方法**: `wx.request`

### 后端接口

**接口地址**: `/user/wx/login/`

**请求方法**: `POST`

**请求参数 (Body)**:

| 参数名 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| code | string | 是 | 微信登录临时凭证 | `081...` |
| nickName | string | 否 | 用户昵称 | `微信用户` |
| avatarUrl | string | 否 | 用户头像URL | `https://...` |

**响应数据结构 (Response)**:

- **状态码 200 (成功)**

```json
{
  "access": "eyJhbG...", // JWT Access Token
  "refresh": "eyJhbG...", // JWT Refresh Token
  "user_id": 123,
  "message": "Login success"
}
```

- **状态码 400/500 (失败)**
  - 登录失败，可能原因包括 code 无效、服务器错误等。

### 示例代码

```javascript
wx.request({
  url: `${app.globalData.globalUrl}/user/wx/login/`,
  method: 'POST',
  data: {
    code: loginRes.code,
    nickName: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl
  },
  success: (res) => {
    if (res.statusCode === 200 && res.data.access) {
      // 存储 token 和 userId
      wx.setStorageSync('accessToken', res.data.access);
      wx.setStorageSync('userId', res.data.user_id);
      // 跳转逻辑...
    }
  }
});
```
