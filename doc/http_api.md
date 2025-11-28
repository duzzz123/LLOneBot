# OneBot HTTP API 调用指南

本文简述 LLOneBot 的 OneBot 11 HTTP / HTTP POST 接口如何启用与调用。

## 开启 HTTP / HTTP POST
- 默认配置文件中提供了 HTTP 与 HTTP POST 连接的示例；将对应连接的 `enable` 设为 `true`，并按需设置端口或上报地址即可。配置示例：
  - HTTP 服务器：`type: "http"`，指定 `port` 与可选的 `token`、`messageFormat` 等字段。
  - HTTP POST 上报：`type: "http-post"`，指定 `url`、`token`（用于 HMAC 签名）以及是否开启心跳 `enableHeart`。
- 默认配置文件位于 `src/common/default_config.json`，可作为手动编辑或 WebUI 参考。编辑后重启程序生效。

## HTTP 服务器（拉取模式）
- 启动后对外暴露 `http://<host>:<port>/`，其中 `<port>` 为配置中的 `port`。
- 事件订阅：通过 Server-Sent Events 连接 `/_events`（如 `curl -N http://127.0.0.1:3000/_events`）接收实时事件推送。
- 调用动作：将 OneBot 11 / llonebot 动作名称作为路径，发送 GET 或 POST 均可，参数为 JSON（POST 体或查询串会自动合并）。例如：
  ```bash
  curl -X POST "http://127.0.0.1:3000/send_msg" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{"message_type":"private","user_id":123456,"message":"hello"}'
  ```
- 鉴权：若配置了 `token`，可在 `Authorization: Bearer <token>` 头或 `?access_token=<token>` 查询参数传入；未匹配会返回 403。

### 常用动作示例
- **添加好友（llonebot：`add_friend`）**
  - 路径：`/add_friend`
  - 请求参数：
    - `user_id`（必填）：QQ 号或 UID
    - `comment`（选填）：验证信息，不填默认空字符串
    - `source_id`（选填）：来源标识，默认 `0`
    - `group_id`（选填）：若从群聊添加，可传群号
  - 请求示例：
    ```bash
    curl -X POST "http://127.0.0.1:3000/add_friend" \
      -H "Content-Type: application/json" \
      -d '{"user_id":123456789,"comment":"一起玩","group_id":987654321}'
    ```
  - 返回：调用成功时 `data` 为 `null`，失败会在 `message` 字段展示原因。

- **搜索 QQ 用户（llonebot：`search_user`）**
  - 路径：`/search_user`
  - 请求参数：
    - `keyword`（必填）：QQ 号。
  - 返回字段：`uid`、`uin`、`nickname`、`long_nick`、`qid`、`age`、`sex`、`level`、`avatar_url`、`is_friend`。
  - 请求示例：
    ```bash
    curl -X GET "http://127.0.0.1:3000/search_user?keyword=123456789"
    ```

- **搜索 QQ 群（llonebot：`search_group`）**
  - 路径：`/search_group`
  - 请求参数：
    - `group_id`：群号，提供时返回单个群的详细信息。
    - `keyword`：关键字，支持匹配群名、群备注或群号，提供时返回匹配到的群列表。
    - `limit`：可选，关键字搜索时返回的最大条目数。
  - 返回字段：
    - 以 `group_id` 查询：返回单个群对象，包含 `group_id`、`group_name`、`member_count`、`max_member_count`、`owner_uid`、`owner_uin`、`group_memo`、`remark_name`、`join_group_auth`、`is_conf_group`。
    - 以 `keyword` 查询：返回对象 `{ groups: [] }`，列表项包含 `group_id`、`group_name`、`member_count`、`max_member_count`、`owner_uid`、`owner_uin`、`remark_name`、`is_conf_group`。
  - 请求示例：
    ```bash
    # 群号精准查询
    curl -X GET "http://127.0.0.1:3000/search_group?group_id=987654321"

    # 关键词模糊搜索
    curl -X GET "http://127.0.0.1:3000/search_group?keyword=游戏&limit=5"
    ```

- **申请加入 QQ 群（llonebot：`join_group`）**
  - 路径：`/join_group`
  - 请求参数：
    - `group_id`（必填）：群号。
    - `comment`：可选，申请附言。
    - `source_id`：可选，来源标识，默认 0。
    - `inviter_uid`：可选，若通过邀请链接申请可传入邀请人 UID。
    - `ticket`：可选，部分加群渠道携带的校验 ticket。
  - 返回字段：`group_id`、`status`（固定为 `ok` 表示提交成功）。
  - 请求示例：
    ```bash
    curl -X POST "http://127.0.0.1:3000/join_group" \
      -H "Content-Type: application/json" \
      -d '{"group_id": "987654321", "comment": "一起玩"}'
    ```

- **关键词搜索（llonebot：`search`）**
  - 路径：`/search`
  - 请求参数：
    - `keyword`（必填）：用于匹配联系人和群聊的关键词，可为昵称、备注或号码的部分字符串。
  - 返回字段：
    - `users`：匹配到的 QQ 列表，每项包含 `uid`、`uin`、`nickname`、`remark`、`qid`、`avatar_url`。
    - `groups`：匹配到的群列表，每项包含 `group_id`、`group_name`、`remark_name`、`member_count`、`max_member_count`、`owner_uid`、`is_conf_group`。
  - 请求示例：
    ```bash
    curl -X GET "http://127.0.0.1:3000/search?keyword=游戏"
    ```

## HTTP POST（推送模式）
- 当 `type` 为 `http-post` 且 `enable` 为 `true` 时，事件会以 POST 方式推送到配置的 `url`。
- 若配置了 `token`，推送时会在请求头增加 `x-signature: sha1=<HMAC>`，计算方式为 `HMAC_SHA1(body, token)`。
- 可选心跳：开启 `enableHeart` 后，会按 `heartInterval` 周期发送心跳事件。

## 调试提示
- `reportSelfMessage` / `reportOfflineMessage` 控制是否上报自身消息与离线消息，`messageFormat` 可在数组与字符串间切换。
- 若需要查看原始消息或快速操作响应，请在配置中打开 `debug`。
