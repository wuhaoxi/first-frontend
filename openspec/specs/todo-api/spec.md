# Spec: Todo 待办清单模块

## 1. 模块边界

### 包含 (In Scope)

- 创建待办事项（title 必填，description/priority/dueDate/tags 可选）
- 查询待办列表（支持按状态筛选：全部/未完成/已完成）
- 查看单个待办详情
- 更新待办内容（修改标题、描述、优先级、截止日期、标签）
- 标记完成 / 取消完成
- 删除待办事项
- 单用户私有（所有 Todo 属于当前系统唯一用户，无鉴权）

### 不包含 (Out of Scope)

- 多用户 / 协作 / 分享
- 评论 / 附件 / 子任务
- 循环待办 (recurring)
- 标签 / 分类系统（改为简单字符串数组，无独立实体）
- 通知 / 提醒推送
- 批量操作（本期不做）
- 排序 / 拖拽排序（本期不做）
- 分页（当前单用户场景数据量有限，后续按需添加）
- 并发保护（toggle 等操作无乐观锁，接受最终一致性）

---

## 2. 核心场景

### 2.1 创建待办

**正常路径**

```
WHEN 用户提交 POST /api/todos，body 包含合法 title 和可选 tags 数组
THEN 系统返回 201 Created
AND  响应体包含新建的 Todo 对象（含 id、createdAt、completed=false、tags）

WHEN title 为空字符串或仅含空格
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "title must not be blank"

WHEN title 超过 200 个字符
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "title must not exceed 200 characters"

WHEN priority 字段值不是 LOW / MEDIUM / HIGH 之一
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "priority must be one of: LOW, MEDIUM, HIGH"

WHEN tags 数组中某个元素超过 50 个字符
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "each tag must not exceed 50 characters"

WHEN tags 数组超过 10 个元素
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "tags must not exceed 10 items"

WHEN tags 数组中某个元素包含逗号
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "tags must not contain commas"

WHEN tags 数组中包含空白或仅含空格的元素
THEN 系统自动 trim 并过滤掉空白元素（不报错）

WHEN dueDate 是过去的时间
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "dueDate must not be in the past"
```

### 2.2 查询待办列表

**正常路径**

```
WHEN 用户请求 GET /api/todos（无筛选参数）
THEN 系统返回 200 OK
AND  响应体包含所有 Todo 的数组，按 createdAt 降序排列

WHEN 用户请求 GET /api/todos?status=active
THEN 系统返回 200 OK
AND  响应体仅包含 completed=false 的 Todo

WHEN 用户请求 GET /api/todos?status=completed
THEN 系统返回 200 OK
AND  响应体仅包含 completed=true 的 Todo
```

**异常路径**

```
WHEN status 参数不是 all / active / completed 之一
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "status must be one of: all, active, completed"
```

### 2.3 查看单个待办

```
WHEN 用户请求 GET /api/todos/{id}，且该 id 存在
THEN 系统返回 200 OK
AND  响应体包含对应的 Todo 对象

WHEN 用户请求 GET /api/todos/{id}，且该 id 不存在
THEN 系统返回 404 Not Found
AND  响应体包含错误信息 "Todo not found with id: {id}"

WHEN 用户请求 GET /api/todos/{id}，且该 id 不是合法数字
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "id must be a valid number"
```

### 2.4 更新待办

**正常路径**

```
WHEN 用户提交 PUT /api/todos/{id}，id 存在且 body 合法
THEN 系统返回 200 OK
AND  响应体包含更新后的 Todo 对象
AND  updatedAt 字段被刷新为当前时间
```

**异常路径**

```
WHEN id 不存在
THEN 系统返回 404 Not Found
AND  响应体包含错误信息 "Todo not found with id: {id}"

WHEN title 更新为空字符串
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "title must not be blank"

WHEN title 超过 200 个字符
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "title must not exceed 200 characters"

WHEN priority 值非法
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "priority must be one of: LOW, MEDIUM, HIGH"

WHEN tags 数组中某个元素超过 50 个字符
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "each tag must not exceed 50 characters"

WHEN tags 数组中某个元素包含逗号
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "tags must not contain commas"

WHEN tags 数组中包含空白或仅含空格的元素
THEN 系统自动 trim 并过滤掉空白元素（不报错）

WHEN tags 数组超过 10 个元素
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "tags must not exceed 10 items"

WHEN dueDate 是过去的时间
THEN 系统返回 400 Bad Request
AND  响应体包含错误信息 "dueDate must not be in the past"
```

### 2.5 标记完成 / 取消完成

**正常路径**

```
WHEN 用户提交 PATCH /api/todos/{id}/toggle，id 存在且当前 completed=false
THEN 系统返回 200 OK
AND  响应体 completed=true，completedAt 为当前时间

WHEN 用户提交 PATCH /api/todos/{id}/toggle，id 存在且当前 completed=true
THEN 系统返回 200 OK
AND  响应体 completed=false，completedAt=null
```

**异常路径**

```
WHEN id 不存在
THEN 系统返回 404 Not Found
AND  响应体包含错误信息 "Todo not found with id: {id}"
```

### 2.6 删除待办

**正常路径**

```
WHEN 用户提交 DELETE /api/todos/{id}，id 存在
THEN 系统返回 204 No Content
AND  该 Todo 从数据库中移除
```

**异常路径**

```
WHEN id 不存在
THEN 系统返回 404 Not Found
AND  响应体包含错误信息 "Todo not found with id: {id}"
```

---

## 3. 数据结构

### 3.1 Todo 响应对象

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 自动生成，只读 | 主键 |
| title | String | 1–200 字符，必填 | 待办标题 |
| description | String | 0–2000 字符，可选 | 详细描述 |
| priority | Enum | LOW / MEDIUM / HIGH，默认 MEDIUM | 优先级 |
| completed | Boolean | 默认 false | 是否完成 |
| completedAt | LocalDateTime | 可空 | 完成时间 |
| dueDate | LocalDateTime | 可空，不早于当前时间 | 截止日期 |
| tags | List<String> | 可选，最多 10 个，每个 1–50 字符，不含逗号 | 标签列表（自动 trim + 过滤空白） |
| createdAt | LocalDateTime | 自动生成，只读 | 创建时间 |
| updatedAt | LocalDateTime | 自动更新，只读 | 最后更新时间 |

### 3.2 CreateTodoRequest

```json
{
  "title": "Buy groceries",          // 必填，1–200 字符
  "description": "Milk, eggs, bread", // 可选，0–2000 字符
  "priority": "HIGH",                 // 可选，默认 "MEDIUM"
  "dueDate": "2026-07-25T18:00:00",   // 可选，ISO 8601，不早于当前时间
  "tags": ["work", "urgent"]           // 可选，最多 10 个，每个 1–50 字符，不含逗号（自动 trim）
}
```

### 3.3 UpdateTodoRequest

```json
{
  "title": "Buy groceries (updated)",  // 可选，1–200 字符
  "description": "Milk, eggs, bread, butter", // 可选，0–2000 字符
  "priority": "LOW",                    // 可选
  "dueDate": "2026-08-01T12:00:00",    // 可选，不早于当前时间
  "tags": ["work"]                     // 可选
}
```

> 所有字段均为可选，仅更新传入的字段。

### 3.4 TodoResponse

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "HIGH",
  "completed": false,
  "completedAt": null,
  "dueDate": "2026-07-25T18:00:00",
  "tags": ["work", "urgent"],
  "createdAt": "2026-07-18T10:30:00",
  "updatedAt": "2026-07-18T10:30:00"
}
```

### 3.5 ErrorResponse

```json
{
  "message": "title must not be blank",
  "status": 400,
  "timestamp": "2026-07-18T10:30:00"
}
```

> 所有错误响应统一返回 `ErrorResponse` 对象，包含 `message`、`status`（HTTP 状态码）、`timestamp`（ISO 8601）。
> 字段验证错误额外包含 `errors` 数组，每个元素包含 `field` 和 `message`。

---

## 4. API 端点汇总

| Method | Path | 说明 | 成功状态码 |
|--------|------|------|-----------|
| POST | /api/todos | 创建待办 | 201 |
| GET | /api/todos | 查询列表（可选 ?status=） | 200 |
| GET | /api/todos/{id} | 查询单个 | 200 |
| PUT | /api/todos/{id} | 更新待办 | 200 |
| PATCH | /api/todos/{id}/toggle | 切换完成状态 | 200 |
| DELETE | /api/todos/{id} | 删除待办 | 204 |

---

## 5. 验收标准

- [ ] tags 字段正确持久化和返回，每个 tag 1–50 字符，最多 10 个，不含逗号
- [ ] tags 自动 trim 并过滤空白元素
- [ ] tag 包含逗号时返回 400
- [ ] Todo 实体持久化到数据库，字段与数据结构定义一致
- [ ] POST /api/todos 创建待办，返回 201 和完整 Todo 对象
- [ ] GET /api/todos 返回全部待办，按 createdAt 降序
- [ ] GET /api/todos?status=active 仅返回未完成项
- [ ] GET /api/todos?status=completed 仅返回已完成项
- [ ] GET /api/todos/{id} 返回单个待办，不存在时返回 404
- [ ] PUT /api/todos/{id} 更新指定字段，刷新 updatedAt
- [ ] PATCH /api/todos/{id}/toggle 切换完成状态，更新 completedAt
- [ ] DELETE /api/todos/{id} 删除后返回 204，不存在时返回 404
- [ ] title 为空或超长时返回 400
- [ ] priority 非法时返回 400
- [ ] dueDate 为过去时间时返回 400
- [ ] status 参数非法时返回 400
- [ ] 所有字段使用驼峰命名（camelCase），前后端一致
- [ ] 所有时间格式为 ISO 8601（yyyy-MM-dd'T'HH:mm:ss）
- [ ] 错误响应统一 ErrorResponse 格式（message + status + timestamp）
- [ ] 非数字 id 返回 400 "id must be a valid number"
- [ ] 数据库错误不泄露内部信息（返回通用消息）
- [ ] 单用户私有，无鉴权逻辑，所有 Todo 属于系统唯一用户
- [ ] 数据库 todos 表包含 (completed, created_at) 复合索引
- [ ] 单元测试覆盖所有正常路径和异常路径（≥47 个测试用例）
- [ ] 前端类型定义与后端响应结构完全匹配
