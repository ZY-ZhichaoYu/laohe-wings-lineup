# publishLineup：发布与互动接口

此函数部署后才会改变线上写入行为；本地代码通过测试并不能证明生产环境已更新。

## 配置与部署顺序

1. 备份数据库集合 lineups 的现有文档及当前云函数版本。
2. 保持数据库客户端权限为 ADMINWRITE，禁止网页直接写入 lineups。
3. 在函数环境变量中配置足够长、随机、仅管理人员持有的 EDIT_SECRET。未配置时发布和队内身份写入一律拒绝。
4. 上传本目录的 index.js、security.js、package.json，安装依赖后部署函数。直接依赖固定为 @cloudbase/node-sdk 3.18.3。本次环境无法连接 npm registry，尚未生成传递依赖 lockfile；部署前在可联网环境运行 npm install --package-lock-only --ignore-scripts，再使用 npm ci --omit=dev。
5. 再上传配套前端版本。新函数要求发布请求提供 baseUpdatedAt；旧页面需要刷新，不能继续发布。
6. 如使用本项目之外的照片域名，在 IMAGE_PROXY_ALLOWED_HOSTS 中添加精确主机名，逗号分隔。例如 images.example.com。不支持通配符、HTTP、IP字面量、非443端口。
7. 用测试队伍检查发布、同步、图片导出和并发互动，再通知队员使用。不要在生产数据中留下测试评价。

图片代理默认只放行本项目的两个 CloudBase 应用域名。属于本环境的 cloud:// 文件由服务端 SDK 换取临时 URL，单次仅信任这个 URL 的确切主机；每一跳重定向仍检查白名单。DNS 只使用经过私网/保留地址检查的 IPv4。图片仅接受 JPEG、PNG、WebP、GIF、AVIF，大小上限8MB。

## 队伍与云端文档

| workspaceId | docId | matchFormat | 阵型 |
| --- | --- | --- | --- |
| legacy-11 | current | 11 | 433、442、352、4231 |
| wings-8 | current-wings-8 | 8 | 8-232、8-322、8-331 |
| zhiyin-8 | current-zhiyin-8 | 8 | 8-232、8-322、8-331 |

所有互动动作必须携带当前队伍的 workspaceId 或对应 docId。两者同时提供时必须匹配。省略两者仅兼容原 current 文档。

8人快照必须含 workspaceId、matchFormat: 8、匹配的 formation，以及恰好8名首发。首发和替补内号码不能重复。原11人快照可省略新增身份字段，发布后会补齐。

## 发布

请求字段：action: publishLineup、workspaceId、docId、editToken、snapshot、baseUpdatedAt。

baseUpdatedAt 是上一次读取云端文档时的 updatedAtText，首次创建新文档传空字符串。不要用本机当前时间代替。成功响应提供新的 updatedAt，前端应保存作为下一次发布的基准。

- BASE_VERSION_REQUIRED：缺少基准版本，刷新并读取云端后重试。
- VERSION_CONFLICT：其他人已更新，不可自动重试覆盖。保留本地修改，由编辑者重新载入后合并。
- TRANSACTIONS_REQUIRED / TRANSACTION_FAILED：停止写入；没有普通读改写回退。保留本地修改并检查部署或稍后重试。

发布在事务中比较版本并写入，始终保留服务器已有的 reviewsData、attendanceData、mvpVotesData。发布不能用于导入、清空或回滚互动记录；这些字段必须经各自的互动接口操作。所有写入更新时间保持单调递增，避免同毫秒更新共享版本号。

## 验证

无需连接线上数据库即可执行：

    node --test cloudfunctions/publishLineup/security.test.js

测试使用模拟数据库，覆盖权限、队伍隔离、阵型人数、SSRF URL检查、并发报名、发布版本冲突与保留互动、事务失败拒写。上线后仍需在真实 CloudBase 环境验证事务、存储临时URL和手机导出。

## 仍有边界

游客报名、投票和朋友身份是自报身份，不是实名成员认证。公开快照中的 deviceId 不能证明所有权，因此 deleteReview / deleteReply 现只允许持有效 EDIT_SECRET 的管理员操作，且不再受10分钟限制。前端应隐藏游客撤回按钮，为管理员提供“删除”，请求必须携带 editToken。若今后恢复自助撤回，应使用仅提交者持有的私密撤回令牌或成员登录。

队员自主上传照片不应获得管理员 EDIT_SECRET；建议使用邀请令牌限定球员身份或待审核提交，再由管理员采用。不要把前端解锁状态视为云存储写入授权。
