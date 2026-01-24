# 班级成员页 (ClassMembers) 前后端接口文档

## 1. 获取班级成员列表

### 前端调用

页面加载 (`onLoad`) 或下拉刷新 (`onPullDownRefresh`) 时调用。

- **接口地址**: `/class/{classId}/members/`
- **请求方法**: `GET`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**响应数据 (Response)**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "nickname": "张三",
      "username": "zhangsan",
      "avatar": "https://...",
      "student_id": "2023001",
      "role": "student"
    },
    // ...
  ]
}
```

## 2. 移除班级成员

### 前端调用

教师点击“移除”按钮并确认后调用 (`removeMember`)。

- **接口地址**: `/class/{classId}/members/{userId}/`
- **请求方法**: `DELETE`

### 后端接口

**请求头**:
| 字段名 | 必填 | 说明 |
| :--- | :--- | :--- |
| Authorization | 是 | `Bearer <token>` |

**路径参数**:
| 参数名 | 说明 |
| :--- | :--- |
| classId | 班级ID |
| userId | 要移除的成员用户ID |

**响应数据**:
- 200: 移除成功
- 其他: 移除失败 (如权限不足)
