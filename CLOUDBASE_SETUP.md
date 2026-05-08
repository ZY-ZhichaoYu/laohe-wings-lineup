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

这个函数会把当前阵容写入 `lineups/current`。因为 `lineups` 是 `ADMINWRITE`，普通网页用户只能读，不能直接改数据库；写入统一走这个云函数。

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

## 4. 验证多人同步

1. 用电脑打开 CloudBase 默认域名。
2. 用手机也打开同一个链接。
3. 电脑上切换阵型或球衣。
4. 手机页面应在几秒内自动变成同样状态。

如果本地 `127.0.0.1` 或 GitHub Pages 打开，页面会保持 `本地模式`。这是因为体验版不能添加自定义安全域名，CloudBase SDK 只能在已允许的默认域名里正常工作。
