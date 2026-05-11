# 老和山之翼阵容海报生成器

浙江大学老和山之翼足球队阵容海报生成器。项目保持单页前端结构，同时接入腾讯云 CloudBase，用于国内访问、当前阵容同步和共享照片上传。

正式访问地址：

https://laohe-wings-lineup-d3cz65831519b-1429692601.tcloudbaseapp.com/

备用地址：

https://zy-zhichaoyu.github.io/laohe-wings-lineup/

## 当前功能

- 阵型查看与切换：`4-3-3`、`4-4-2`、`3-5-2`、`4-2-3-1`。
- 主客场球衣、队徽和球员卡自动切换。
- 首发、替补、教练与领队、绝版人物卡片展示。
- 首发替换支持替补、教练和绝版人物；支持下拉换人和拖拽换人。
- 随机抽卡，包含首发、替补、教练、领队、绝版人物，以及隐藏 `UNBELIEVABLE` 彩蛋卡。
- 球员评价：无需编辑口令，输入一位熟悉的老和山球员号码和自己的昵称后，可给球员、教练、领队和绝版人物打分留言。
- 海报文字、球员资料、照片、队徽在线编辑。
- PNG 海报导出，手机端会打开图片预览页，可长按保存；云端照片会先经过导出安全处理。
- CloudBase 同步当前阵容：一人发布后，其他人刷新或实时监听后可看到同一版本。
- CloudBase 云存储共享照片：电脑或手机上传后，其他设备也能看到。

## 查看模式和编辑模式

页面默认是只读模式。队友无需口令也可以：

- 查看当前阵容。
- 切换阵型查看不同站位。
- 切换主客场。
- 随机抽卡。
- 导出 PNG 海报。

需要改阵容、上传照片、编辑球员资料或发布到云端时，输入编辑口令：

```text
老和山无内鬼
```

解锁后可以：

- 换人和拖拽首发，替补、教练和绝版人物都可以拖到场上。
- 上传球员、教练、领队、绝版人物照片。
- 上传队徽。
- 修改球员资料、状态和数据。
- 点击 `发布到云端`，把当前阵容写入 CloudBase。

## 评价权限

评价权限和编辑权限已拆开：

- 编辑口令只用于阵容管理、上传照片、修改资料和发布云端。
- 评价不需要编辑口令，适合发给队友或外部朋友参与。
- 评价前需要输入一位熟悉的老和山球员号码，以及自己的昵称。
- 展示时会显示为 `某某的朋友 昵称`，例如输入 `20` 和昵称 `lll`，会显示 `张子冲的朋友 lll`。
- 同一个人可以对同一对象写多条评价，新评价不会覆盖旧评价。

## 数据同步说明

当前同步分两层：

- `lineups/current`：CloudBase 里的正式当前阵容，所有人共享。
- 浏览器 `localStorage`：个人浏览器里的临时草稿和预设。

在 CloudBase 正式地址打开时，页面会优先读取 `lineups/current`。编辑模式下修改后点击 `发布到云端`，其他人刷新页面即可看到新阵容。

评价也保存在同一个 `lineups/current` 快照里，字段为 `reviewsData`。每次提交都会新增一条评价，不再按号码覆盖旧评价。普通评价提交会通过 `publishLineup` 云函数只更新评价字段，不授予阵容编辑权限。

GitHub Pages 备用地址不连接 CloudBase 写入能力，主要用于静态备份和海外访问。

## 照片同步说明

CloudBase 正式地址下上传照片时，页面会：

1. 把图片上传到 CloudBase 云存储。
2. 获取图片 HTTPS 访问地址，同时保存云存储 `fileID` 引用。
3. 把这个云存储引用保存到 `lineups/current`。

这样手机上传的球员照片，电脑端刷新后也能看到。页面显示和导出前会根据 `fileID` 重新换取临时访问地址，避免只保存旧临时 URL 后第二天失效。

注意：如果某张照片是在这个机制上线前上传的，旧数据里可能只有一个已经过期的临时 HTTPS 地址，没有 `fileID`。这种照片需要重新上传一次，之后就会按新的云存储引用保存。

如果上传失败，通常需要检查：

- CloudBase 匿名登录是否开启。
- 云存储权限是否允许已登录用户上传。
- 静态网站默认域名是否在安全来源里。
- 浏览器是否强制拦截第三方或跨域请求。

## 本地预览

本地预览只适合看静态页面和做代码开发。由于 CloudBase 体验版不能添加 `127.0.0.1` 安全来源，本地不会连接云端同步。

Python：

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000
```

Node.js：

```bash
npx serve .
```

## 项目结构

```text
index.html                         单页应用
cloudbase-config.js                CloudBase 前端配置
CLOUDBASE_SETUP.md                 CloudBase 控制台部署步骤
data/players.json                  默认球员数据
assets/players/                    球员照片
assets/legends/                    绝版人物照片
assets/staff/                      教练与领队照片
assets/team/                       队徽
cloudfunctions/publishLineup/      发布当前阵容并代理导出图片的 CloudBase 云函数
```

## CloudBase 部署

静态网站托管需要上传：

```text
index.html
cloudbase-config.js
assets/
data/
```

云函数需要部署：

```text
cloudfunctions/publishLineup/
```

HTTP 访问服务需要配置路由：

```text
访问路径：/api/publishLineup
关联资源：publishLineup
身份认证：关闭
方法：POST 或全部方法
```

详细步骤见：

```text
CLOUDBASE_SETUP.md
```

## GitHub Pages

GitHub Pages 保留为备用静态地址。它可以展示仓库里的默认数据和图片，但不作为正式多人同步入口。

如果需要更新 GitHub Pages：

1. 合并或推送到 `main` 分支。
2. 仓库 `Settings` → `Pages`。
3. 使用 GitHub Actions 或 `Deploy from a branch` 部署。

## 维护流程

常规更新顺序：

1. 在本地 `cloudbase-sync` 分支修改。
2. 测试 `index.html` 语法和基础功能。
3. 提交并推送到 GitHub。
4. 覆盖上传 CloudBase 静态网站文件。
5. 如云函数有变化，重新部署 `publishLineup`，否则移动端导出和云端发布可能仍使用旧逻辑。
6. 在正式地址用电脑和手机分别验证。

## English

Laohe Wings Lineup Poster Generator is a single-page frontend app for Zhejiang University SAA Laohe Wings. The official China-friendly entrypoint is:

```text
https://laohe-wings-lineup-d3cz65831519b-1429692601.tcloudbaseapp.com/
```

GitHub Pages remains a backup/static mirror:

```text
https://zy-zhichaoyu.github.io/laohe-wings-lineup/
```

### Features

- Formation preview and switching: `4-3-3`, `4-4-2`, `3-5-2`, `4-2-3-1`.
- Home/away kit switching with matching team logo and player cards.
- Starting XI, bench, coach, manager, and Hall of Fame cards.
- Drag-and-drop or dropdown substitutions, including bench players, coach, and Hall of Fame members.
- Random card draw, including a hidden `UNBELIEVABLE` special card.
- Player reviews for players, coach, manager, and Hall of Fame members.
- Online editing for poster text, player data, photos, and team logos.
- PNG poster export. On mobile, the app opens a preview image so users can long-press and save.
- CloudBase sync for the current lineup and shared uploaded photos.

### Read-Only And Edit Modes

The app opens in read-only mode by default. Visitors can view the lineup, switch formations, switch kits, draw random cards, export the poster, and submit reviews.

The edit password is only for management tasks: changing the lineup, uploading photos, editing player data, and publishing the shared lineup to CloudBase.

### Review Access

Reviews no longer require the edit password. A reviewer enters:

- the number of a Laohe player they know well;
- their nickname;
- rating and optional comment.

The review is displayed as `Friend of PlayerName Nickname`. For example, entering `20` and `lll` displays `张子冲的朋友 lll`.

Each submission creates a new review. A later review from the same number and nickname does not overwrite earlier comments.

### Data Sync

CloudBase document `lineups/current` is the shared source of truth. Browser `localStorage` is only used for personal drafts, presets, and local fallback.

Reviews are stored in `reviewsData` inside the same shared snapshot. Public review submissions go through the `publishLineup` CloudBase function and only update the review list; they do not grant lineup editing rights.

### Deployment Notes

Static hosting should include:

```text
index.html
cloudbase-config.js
assets/
data/
```

Deploy the CloudBase function:

```text
cloudfunctions/publishLineup/
```

Configure the HTTP route:

```text
Path: /api/publishLineup
Resource: publishLineup
Authentication: Off
Method: POST or All
```

After changing `cloudfunctions/publishLineup/`, redeploy the function in CloudBase. Uploading only `index.html` is not enough for server-side review saving or mobile export proxy changes.

## 致谢

感谢浙江大学老和山之翼的每一位队员、领队、教练和绝版人物。这个页面的目标是让大家能方便地生成阵容海报、维护球员卡，也能把球队内部的小故事留在卡片里。
