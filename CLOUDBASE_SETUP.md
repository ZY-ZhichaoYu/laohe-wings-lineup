# CloudBase 同步部署步骤

当前环境：

- envId: `laohe-wings-lineup-d3cz65831519b`
- region: `ap-shanghai`
- 静态网站默认域名：`laohe-wings-lineup-d3cz65831519b-1429692601.tcloudbaseapp.com`
- 数据库集合：`lineups`
- 数据库权限建议：`ADMINWRITE`

## 1. 部署静态网站

进入 CloudBase 控制台：

1. 打开 `静态网站托管`。
2. 进入 `文件管理`。
3. 上传项目根目录里的这些内容：
   - `index.html`
   - `cloudbase-config.js`
   - `assets/`
   - `data/`
4. 上传后访问默认域名，确认页面能打开。

## 2. 创建云函数 publishLineup

进入 CloudBase 控制台：

1. 打开 `云函数 / 托管 / 主机`。
2. 新建云函数，函数名填：`publishLineup`。
3. 运行环境选择 Node.js。
4. 上传本项目里的 `cloudfunctions/publishLineup/` 目录。
5. 部署完成后进入函数详情，确认依赖安装成功。

这个函数会把当前阵容写入 `lineups/current`，也会处理朋友评价、评价回复、评价/回复撤回、到场报名、MVP 投票，并在手机端导出 PNG 时代理读取云存储图片，避免 iOS/微信浏览器因为跨域图片阻止 `canvas` 导出。因为 `lineups` 是 `ADMINWRITE`，普通网页用户只能读，不能直接改数据库；写入统一走这个云函数。

### 2.1 配置编辑口令环境变量 `EDIT_SECRET`（必做，否则无法发布）

从本次加固版起，"发布整份阵容"和"以队内身份（team_edit）发表评价/回复"会在**服务端**校验口令，而不再只靠前端判断（前端口令可被直接 POST 绕过）。真正的口令保存在云函数环境变量 `EDIT_SECRET` 里，**不写进任何公开代码**。

1. 进入 `publishLineup` 云函数详情 → `函数配置` / `环境变量`。
2. 新增环境变量：
   - 名称：`EDIT_SECRET`
   - 值：你自定义的强口令（**请与页面里的软口令 `老和山无内鬼` 不同**；页面里那个只用于离线本机解锁，源码公开可见，不是安全边界）。
3. 保存并让函数重新部署生效。
4. 把这个新口令线下发给需要编辑的队务人员。线上解锁编辑时输入的就是它（页面会把它发给云函数校验，不在本地保存明文之外的东西）。

> ⚠️ 如果不配置 `EDIT_SECRET`，云函数会**默认拒绝**所有发布和 team_edit 写入（fail-closed，返回 `EDIT_SECRET_REQUIRED`）。这是有意为之：宁可暂时发布不了，也不留"谁都能覆盖全队数据"的洞。朋友评价、报名、MVP 投票**不受影响**，仍然开放。

（可选）图片代理已加 SSRF 防护：`proxyImage` 会拒绝解析到内网 / 环回 / 云元数据段（如 `169.254.169.254`）的地址，仍然允许代理任意**公网**图片。如需进一步限制，可自行在函数里加 host 白名单。

## 3. 首次发布阵容

1. 用 CloudBase 默认域名打开网页。
2. 页面顶部 `同步` 状态应显示 `云端已连接` 或 `云端暂无阵容，使用本地`。
3. 调整一次阵容或点击 `发布到云端`。
4. 回到文档型数据库的 `lineups` 集合，确认出现 `_id = current` 的文档。

如果发布失败，请先重新上传这 3 个文件：

- `index.html`
- `cloudbase-config.js`
- `cloudfunctions/publishLineup/index.js`

新版 CloudBase 可能创建的是函数型云托管函数，前端会先按普通云函数调用，失败后自动按 `cloudrun` 再试。重新上传后，失败状态会显示更具体的错误码；也可以在 `publishLineup` 函数详情的 `日志` 页查看 `publishLineup failed`。

如果函数日志仍然没有任何记录，说明 Web SDK 的函数调用在网关层被拦截。请在 `环境管理` → `HTTP 访问服务` → `路由管理` 添加路由：

- 路由：`/api/publishLineup`
- 资源类型：选择能绑定 `publishLineup` 的云函数或函数型云托管
- 资源对象：`publishLineup`
- 路径透传：关闭
- 身份认证：关闭或无需身份认证
- 方法：允许 `POST`，如果只能选全部方法就选全部

配置后前端会优先通过同域 HTTP 路径发布阵容，成功状态会显示 `已同步到云端（HTTP）`。

注意：静态网站域名是 `tcloudbaseapp.com`，HTTP 路由域名是 `ap-shanghai.app.tcloudbase.com`。前端配置里的 `publishHttpPath` 必须使用完整的 HTTP 路由域名：

`https://laohe-wings-lineup-d3cz65831519b-1429692601.ap-shanghai.app.tcloudbase.com/api/publishLineup`

如果继续使用相对路径 `/api/publishLineup`，请求会打到静态网站域名并返回 404，函数日志不会有记录。

## 4. 验证多人同步

1. 用电脑打开 CloudBase 默认域名。
2. 用手机也打开同一个链接。
3. 电脑上切换阵型或球衣。
4. 手机页面应在几秒内自动变成同样状态。

如果本地 `127.0.0.1` 或 GitHub Pages 打开，页面会保持 `本地模式`。这是因为体验版不能添加自定义安全域名，CloudBase SDK 只能在已允许的默认域名里正常工作。

## 5. 编辑口令与照片同步

页面默认是只读模式，队友可以查看阵型、切换主客场、抽卡、查看评价、提交朋友评价和导出海报。需要发布阵容、换人、上传照片、编辑资料或提交队内评价时，输入编辑口令。

- **线上（CloudBase 域名）**：输入的口令会发到云函数用 `EDIT_SECRET` 校验，校验通过才解锁；发布/队内评价也会带着这个口令让服务端再校验一次。所以线上口令就是你在 [2.1](#21-配置编辑口令环境变量-edit_secret必做否则无法发布) 里设置的 `EDIT_SECRET`。
- **离线 / 无云函数（file:// 或 GitHub Pages）**：没有云端可校验，退回页面内置软口令 `老和山无内鬼` 解锁，仅用于本机编辑，此时也无法发布到云端。

> 旧版把口令硬编码在 `index.html` 里、且云端不校验，任何人直接 POST 就能覆盖全队数据。现在服务端校验后，这条路被堵死。若要改口令，改云函数的 `EDIT_SECRET` 环境变量即可，不用改代码。

CloudBase 域名下上传照片时，页面会先把图片传到云存储，再把云存储 `fileID` 引用和当前临时 URL 写进 `lineups/current`。后续显示或导出时，页面会用 `fileID` 重新换取新临时 URL，避免旧临时图片地址过期。如果照片上传失败，检查：

1. 匿名登录是否开启。
2. 云存储权限是否允许已登录用户上传。
3. 静态网站默认域名是否在安全来源里。

评价保存在 `lineups/current.reviewsData`。队内评价需要编辑口令，评价人显示为自己的号码；朋友评价不需要编辑口令，但需要输入熟悉的老和山球员号码和昵称，评价人显示为 `某某的朋友 昵称（IP：粗略属地）`。评价会记录粗略 IP 属地、掩码 IP、设备类型和浏览器信息，用于防乱评和撤回验证；前台不展示完整 IP。IP 属地是第三方查询的尽力结果，查询失败时会省略属地，不影响评价提交。每次提交都会新增一条评价，不再覆盖旧评价。评价和回复都支持最多 6 张图片，包含 GIF 动图；在线版会先上传到 CloudBase 云存储，再把 `fileID` 引用保存到评价数据里。刚提交的评价和回复都可以在 10 分钟内用同一台设备撤回。

赛前互动保存在同一份快照里：`attendanceData` 是到场报名，`mvpVotesData` 是 MVP 投票。网页游客提交时会调用 `publishLineup` 的 `submitAttendance` / `submitMvpVote` 动作，只更新对应字段，不允许直接覆盖整份阵容。

手机端导出 PNG 依赖最新 `index.html` 和 `publishLineup` 云函数。如果导出提示 `The operation is insecure` 或提示图片无法准备导出，先覆盖上传最新 `index.html`；如果仍失败，再重新部署 `cloudfunctions/publishLineup/`。

## Review image fallback

Review and reply images are stored in CloudBase Storage and referenced from `lineups/current` by `fileID`. Non-GIF review images are normalized to standard JPEG before upload; GIFs are kept as GIFs to preserve animation. The frontend first tries a fresh temporary CloudBase URL. If a browser, especially mobile WeChat or iOS Safari, cannot render that URL, `index.html` calls the `publishLineup` HTTP route with `action=proxyImage` and the saved `fileID`; the function fetches the image server-side and returns a data URL. After changing this behavior, redeploy `cloudfunctions/publishLineup/` and upload the latest `index.html`.

## 6. 本次加固说明（并发 / 版本 / 数据源）

- **并发写入**：评价 / 回复 / 报名 / MVP / 撤回等"读-改-写"改为走 CloudBase 事务（`db.startTransaction`），避免两人同时提交互相覆盖（last-write-wins）。若某些运行环境不支持事务，函数会**自动回退**到原来的读-改-写逻辑（功能正常，但退化为 last-write-wins）。
  > ⚠️ 事务这段无法在本地对着线上库跑通，请在**首次部署新函数后**做一次验证：用两台设备/两个标签几乎同时提交评价，确认两条都在，没有互相覆盖；并在函数日志里留意有没有 `transaction path failed, falling back` 的告警。
- **依赖锁版本**：`cloudfunctions/publishLineup/package.json` 里 `@cloudbase/node-sdk` 已从 `latest` 锁到确切版本 `3.18.3`，保证每次部署可复现。以后要升级手动改这里。
- **前端 CDN**：`index.html` 引入的 `html2canvas` / `qrcodejs` 已加 SRI（`integrity`）校验，防止 CDN 内容被篡改。客户端 CloudBase SDK 的 `sdkUrl` 暂仍用 `latest`（原因见 `cloudbase-config.js` 里的注释），如需锁版本请先线上实测。
- **球员数据单一来源**：`data/players.json` 是唯一数据源；`index.html` 里的 `INLINE_PLAYER_DATA`（离线回退副本）改完球员数据后跑一次 `node scripts/sync-inline-players.js` 同步，`--check` 可在提交前校验是否漂移。
