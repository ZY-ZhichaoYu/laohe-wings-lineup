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

这个函数会把当前阵容写入 `lineups/current`，也会处理朋友评价、评价撤回，并在手机端导出 PNG 时代理读取云存储图片，避免 iOS/微信浏览器因为跨域图片阻止 `canvas` 导出。因为 `lineups` 是 `ADMINWRITE`，普通网页用户只能读，不能直接改数据库；写入统一走这个云函数。

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

页面默认是只读模式，队友可以查看阵型、切换主客场、抽卡、查看评价、提交朋友评价和导出海报。需要发布阵容、换人、上传照片、编辑资料或提交队内评价时，输入编辑口令：

`老和山无内鬼`

CloudBase 域名下上传照片时，页面会先把图片传到云存储，再把云存储 `fileID` 引用和当前临时 URL 写进 `lineups/current`。后续显示或导出时，页面会用 `fileID` 重新换取新临时 URL，避免旧临时图片地址过期。如果照片上传失败，检查：

1. 匿名登录是否开启。
2. 云存储权限是否允许已登录用户上传。
3. 静态网站默认域名是否在安全来源里。

评价保存在 `lineups/current.reviewsData`。队内评价需要编辑口令，评价人显示为自己的号码；朋友评价不需要编辑口令，但需要输入熟悉的老和山球员号码和昵称，评价人显示为 `某某的朋友 昵称（IP：粗略属地）`。评价会记录粗略 IP 属地、掩码 IP、设备类型和浏览器信息，用于防乱评和撤回验证；前台不展示完整 IP。IP 属地是第三方查询的尽力结果，查询失败时会省略属地，不影响评价提交。每次提交都会新增一条评价，不再覆盖旧评价。评价和回复都支持一张图片，在线版会先上传到 CloudBase 云存储，再把 `fileID` 引用保存到评价数据里。刚提交的评价可以在 10 分钟内用同一台设备撤回。

手机端导出 PNG 依赖最新 `index.html` 和 `publishLineup` 云函数。如果导出提示 `The operation is insecure` 或提示图片无法准备导出，先覆盖上传最新 `index.html`；如果仍失败，再重新部署 `cloudfunctions/publishLineup/`。
