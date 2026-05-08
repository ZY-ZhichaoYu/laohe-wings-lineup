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

## 4. 验证多人同步

1. 用电脑打开 CloudBase 默认域名。
2. 用手机也打开同一个链接。
3. 电脑上切换阵型或球衣。
4. 手机页面应在几秒内自动变成同样状态。

如果本地 `127.0.0.1` 或 GitHub Pages 打开，页面会保持 `本地模式`。这是因为体验版不能添加自定义安全域名，CloudBase SDK 只能在已允许的默认域名里正常工作。
