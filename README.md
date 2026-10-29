# 老和山阵容工作台

面向老和山两支球队的排阵、名单与照片管理网页。本版新增 2026 浙大星辰杯双队 8 人制，并保留原 11 人制工作区。

这是升级代码及本地验证结果，不能据此认定 CloudBase 线上已更新。本次检查原静态网站地址时观察到 HTTP 404；它只代表当时的访问结果，实际托管、路由与数据状态须部署后重新核验。

## 队伍与比赛形式

| 入口参数 | 队伍 | 比赛形式 | 名单人数 | 有照片 / 待补 |
| --- | --- | --- | ---: | ---: |
| `?team=wings-8`（默认） | 老和山之翼 | 8 人制 | 15 | 10 / 5 |
| `?team=zhiyin-8` | 老和山只因 | 8 人制 | 18 | 13 / 5 |
| `?team=legacy-11` | 原老和山之翼 | 11 人制 | 沿用旧名单 | 沿用旧资料 |

两支 8 人制球队合计 33 名球员，其中 23 人已有照片，10 人保留待补占位。照片按人物姓名及稳定人物 ID 匹配，球衣号码属于本届名单：新 9、14、41 号不会误用旧同号码球员照片。王开来和黄焜宇可复用旧传奇卡中的照片。仅参加本届赛事的新球员素材放在 `data/players.json` 的 `competitionPlayers` 中，不加入历史十一人制名单。

赖飞扬照片已从项目原素材 `Photos/Formal/47lfy_red.png`、`Photos/Formal/47lfy_blue.png` 原样复制为 [`47-赖飞扬-home.png`](assets/players/47-赖飞扬-home.png) 和 [`47-赖飞扬-away.png`](assets/players/47-赖飞扬-away.png)，保留原素材，并核对复制前后的 SHA-256 一致。

张子冲新版主场卡、沈熙洲、徐文浩和李炳灿主场卡已根据用户原照通过内置图像编辑工具制作。提示词与素材来源见 [张子冲](docs/CAPTAIN_IMAGE_PROMPT.md)、[沈熙洲、徐文浩与李炳灿](docs/NEW_PLAYER_IMAGE_PROMPTS.md)。只有单张照片时，主客场均可展示该照片；不会自动把球衣改成另一种颜色。原有个人上传照片不会被仓库更新覆盖。

之翼队长为张子冲，领队为许俊秋；只因队长为程志伟，领队资料暂使用现有的孟红历。名单图片中的个别易混字仍可由队务人员在编辑界面核对修正。

8 人制提供 **2-3-2、3-2-2、3-3-1**，均为 7 名场上球员加 1 名门将。默认阵型与首发依据用户提供的两张排阵截图：

- **之翼 3-2-2**：前锋张天乐、邓翔宇；中场汪昌强、张子冲；后卫黄于翀、徐多、宋健；门将黄焜宇。
- **只因 3-3-1**：前锋李炳灿；中场王开来、张文杰、赖飞扬；后卫李骁、俞智超、程志伟；门将吴优。

新赛事统计归零；除用户明确更新的蒋天鸿、陈炫受伤状态外，不自动继承历史伤停或红牌。陈炫的教练资料也标记受伤，8 人制名单不显示未列入本届名单的教练。11 人制保留 4-3-3、4-4-2、3-5-2、4-2-3-1。

旧版本未经调整的默认 2-3-2 会迁移到上述阵容，保留个人照片、资料和互动；已自定义的首发顺序或阵型保持不变。本次伤停更新只迁移一次，之后可自行修改康复状态。后续手工修改仍是本机草稿，需点击发布才同步。

## 使用方式

1. 在顶部选择队伍；各队独立保存阵容、预设、草稿和云端互动。
2. 点击“编辑本机草稿”或在线输入管理员口令解锁，选择阵型，通过拖动或换人选择框安排首发与替补。
3. 在“完整名单与照片”查看缺照球员，点击“补充球员照片”，进入球员管理上传主、客场照片。
4. 本机修改会保存为草稿。要同步给队员，必须显式点击“发布到云端”；切换阵型、换人、编辑文字不会自动发布。
5. 可导出 PNG 海报及 JSON 备份，保留原有预设、报名、MVP、评价、回复与抽卡入口。

本地模式无需口令，修改只保存在当前浏览器。CloudBase 域名下的编辑口令由云函数环境变量 `EDIT_SECRET` 校验；不要把管理员口令写入前端代码或分发给所有队员。

目前实现的是**管理员补照片**。尚未实现队员独立登录、自助认领球员或照片审核队列；队员可先把照片交给管理员。球员照片接受不超过 12 MB 的 JPG、PNG、WebP，上传前会处理尺寸。云存储失败时页面会提示照片暂存本机，不能当作已经跨设备同步成功。

云端版本发生变化时，发布会被拒绝并提示版本冲突，本机草稿会保留。先导出 JSON 备份，再点击“重新载入云端”，核对最新内容并重新应用所需修改。刷新页面会恢复未发布草稿，不等于丢弃草稿。

## 本地开发与检查

使用 Node.js 20 或更高版本。根项目不依赖打包框架；在 Windows PowerShell 中使用 `npm.cmd`，避免脚本执行策略拦截：

```powershell
npm.cmd start
```

打开 [本机预览](http://127.0.0.1:8765/)。通过查询参数分别检查三种工作区，例如 [只因 8 人制](http://127.0.0.1:8765/?team=zhiyin-8)。本地服务器只绑定 `127.0.0.1`，不会启用线上同步。

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
```

- `check` 检查前端 JavaScript 语法及球员数据生成副本的一致性。
- `test` 运行名单与照片映射、换人后刷新、云同步状态、云函数权限与事务等回归测试。
- `build` 生成球员浏览器数据，并将静态网站文件复制到 `dist/`。
- 修改 `data/players.json` 后也可单独运行 `npm.cmd run build:data`。

测试中的云数据库和网络边界使用模拟实现。通过测试不代表真实 CloudBase 权限、事务、手机微信导出或多设备同步已经验收。

## 代码与数据

| 路径 | 用途 |
| --- | --- |
| `index.html` | 页面结构与第三方脚本入口 |
| `assets/lineup.js` | 排阵、草稿、云同步、互动与导出 |
| `assets/app-ui.js` | 队伍导航、管理入口、名单概览 |
| `assets/competition.js` | 本届双队名单、身份映射、8 人制阵型 |
| `assets/defaults.js` | 默认阵容升级、恢复排阵及一次性伤停迁移 |
| `data/players.json` | 原球队人物资料与照片来源 |
| `assets/players-data.js` | 由脚本生成的浏览器数据副本，不手工编辑 |
| `cloudbase-config.js` | 公开环境与路由配置，不放管理员口令 |
| `cloudfunctions/publishLineup/` | 云端发布、互动、权限与图片代理 |
| `tests/` | 前端数据与同步回归测试 |
| `miniprogram/` | 既有小程序，本次未扩展双队 8 人制 |

调整本届参赛名单与号码时编辑 `assets/competition.js`；调整通用人物照片时编辑 `data/players.json` 并重新生成浏览器数据。在线编辑保存的数据属于当前工作区快照，不会回写仓库文件。

## 云端部署与权限边界

完整步骤见 [CloudBase 部署说明](CLOUDBASE_SETUP.md)。静态托管上传 `dist/` **内部文件**到网站根目录；云函数需要单独部署整个 `cloudfunctions/publishLineup/` 目录，不能只上传 `index.js`。

三套工作区分别使用 `lineups/current-wings-8`、`lineups/current-zhiyin-8`、`lineups/current`。服务端检查队伍、文档、阵型与首发人数的一致性。数据库应禁止普通客户端直接写入，写操作通过云函数执行。

本版的服务端保护包括：

- 发布、队内身份评价/回复、删除评价/回复均校验管理员口令；未配置口令时拒绝这些操作。
- 发布比较读取时的版本，保留服务端最新评价、报名和投票，避免旧排阵快照覆盖互动。
- 写入依赖数据库事务；事务不可用或失败时返回错误，不退回无保护的读改写。
- 图片代理只接受受控 HTTPS 域名、本环境文件引用及安全的实际连接地址；每次跳转重新校验。

仍需明确的限制：

- 报名、MVP 和朋友评价采用游客自报身份；号码、昵称、设备标识不是实名或成员身份认证。
- 照片通过浏览器 SDK 直传云存储，存储权限需独立配置；界面上的编辑开关不能替代存储端权限与配额控制。
- `@cloudbase/node-sdk` 直接依赖固定为 `3.18.3`，尚未锁定完整传递依赖，不能称为完全可复现部署。
- 前端 CloudBase SDK 仍从 `latest` 地址加载；`html2canvas` 和 `qrcodejs` 有 SRI，CloudBase SDK 尚未固定构建及完整性校验。
- 本版没有独立成员账号、细粒度队伍权限、照片审核或完整的防滥用系统。上线前应在真实环境完成部署验收。

## English overview

A lightweight lineup workspace for two eight-a-side teams, with the original eleven-a-side squad retained. Each team has separate local drafts and cloud documents. Default lineups follow the user's supplied screenshots: Wings uses 3-2-2 and Zhiyin uses 3-3-1. Existing portraits are matched by identity; 23 players have photos and 10 retain empty placeholders. Later edits remain local drafts until explicitly published.

Use Node.js 20+, then `npm.cmd start`, `npm.cmd run check`, `npm.cmd test`, and `npm.cmd run build`. Upload the contents of `dist/` to static hosting and deploy the complete cloud-function directory separately. Cloud deployment and real-device behavior require their own acceptance checks; passing local tests does not prove production readiness.
