# 班级详情 (ClassDetail) 前后端接口文档

## 1. 获取班级详情

### 前端调用

页面加载 (`onLoad`) 时调用。

- **接口地址**: `/class/{classId}/`
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
    "id": 1,
    "name": "班级名称",
    "created_by_name": "教师姓名",
    "created_at": "2023-01-01",
    "description": "..."
  }
}
```

## 2. 获取最近作业

### 前端调用

获取该班级的最近作业列表 (`fetchRecentHomeworks`)。

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
  "code": 200,
  "data": [
    {
      "id": 101,
      "title": "作业标题",
      "status": "PENDING",
      "deadline": "2023-10-10",
      "submit_count": 10
    }
  ]
}
```

## 3. 退出班级

### 前端调用

学生用户点击退出班级并确认后调用 (`quitClass`)。

- **接口地址**: `/class/quit/`
- **请求方法**: `POST`

### 后端接口

**请求参数 (Body)**:
| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| class_id | integer | 班级ID |
| user_id | integer | 用户ID |

**响应数据**:
- 200: 退出成功

## 4. 解散班级

### 前端调用

教师用户点击解散班级并确认后调用 (`deleteClass`)。

- **接口地址**: `/class/{classId}/delete/`
- **请求方法**: `DELETE`

### 后端接口

**响应数据**:
- 200: 删除成功
