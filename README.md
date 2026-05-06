# 老和山之翼阵容海报生成器

一个纯前端的学院足球队阵容海报生成器，支持阵型切换、主客场切换、拖拽换人、球员卡照片、随机抽卡、二维码和 PNG 导出。

在线访问地址：

https://YOUR_USERNAME.github.io/laohe-wings-lineup/

## 本地预览

这个项目会用 `fetch` 读取 `data/players.json`，不要直接双击打开 `index.html`，请启动一个本地静态服务器。

方式一：Python

```bash
python3 -m http.server 8000
```

Windows 如果没有 `python3`，可以用：

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000
```

方式二：Node.js

```bash
npx serve .
```

## 怎么用

1. 打开页面后，顶部控制台可以切换 4 种阵型：`4-3-3`、`4-4-2`、`3-5-2`、`4-2-3-1`。
2. 用“球衣”切换主场红色和客场蓝色。
3. 海报上的队名、标题、比赛信息、战术风格、替补标题、绝版人物标题和页脚都可以直接点击编辑。
4. 展开“球员管理”，可以修改号码、姓名、位置、角色、进球、助攻、出场、状态和队长标记。
5. 替补球员可以拖到任意首发位置，完成换人；新上场球员会继承那个位置的标签。
6. 可以上传队徽、球员主客场照片、教练照片和绝版人物照片；上传内容只保存在你自己的浏览器 `localStorage`。
7. “保存当前为预设”可以在本机保存多套阵容；“导出 JSON”可以把当前阵容和上传照片导出成一个预设文件。
8. 填入战报链接后，海报会显示二维码。
9. 点击“导出 PNG 海报”下载海报图片。
10. “随机抽卡”会从首发和替补里随机抽一张球员卡。

## 怎么贡献你的球员卡

### 方式一：发到球队群

适合不会用 GitHub 的队友。

把下面三样东西发到球队群或私发给领队：

- 一张清晰头像或半身照。
- 你的号码和姓名。
- 一句球员卡介绍，风格可以参考页面里的随机抽卡文案，轻松一点、有梗一点。

领队会帮你整理成图片文件和 `data/players.json` 里的介绍。

### 方式二：自己提 Pull Request

适合会用一点 GitHub 的队友。

1. 打开仓库页面，点右上角 `Fork`，复制一份到自己的账号。
2. 进入自己的 fork，点 `Add file` → `Upload files`。
3. 把照片上传到 `assets/players/`，推荐命名：

```text
10-张文杰-home.jpg
10-张文杰-away.jpg
```

如果只有一张照片，也可以先只放：

```text
10-张文杰.jpg
```

4. 打开 `data/players.json`，找到自己的名字，填写照片路径：

```json
{
  "num": 10,
  "name": "张文杰",
  "avatarHome": "assets/players/10-张文杰-home.jpg",
  "avatarAway": "assets/players/10-张文杰-away.jpg"
}
```

5. 在 `intros` 里补上自己的介绍文案。
6. 点 `Commit changes` 保存。
7. 回到原仓库，点 `Contribute` → `Open pull request`。
8. PR 标题写清楚，例如：`Add player card for 10 张文杰`。

### 方式三：网页里上传后导出 JSON

适合想自己调好照片和阵容、但不想改代码的队友。

1. 打开网页。
2. 展开“球员管理”，给自己上传主场照或客场照。
3. 调整姓名、号码、角色、状态等信息。
4. 点击“导出 JSON”。
5. 把下载的 `.json` 文件发给领队。

领队可以从这个文件里取出你的照片和介绍，再合并到仓库。

## 数据和照片

球员数据在：

```text
data/players.json
```

建议把球员照片放在：

```text
assets/players/
```

绝版人物照片放在：

```text
assets/legends/
```

页面兼容两种图片来源：

- `data:` 开头的 base64 图片：来自网页上传，只保存在个人浏览器或导出的 JSON 预设里。
- 相对路径图片：来自仓库文件，例如 `assets/players/10-张文杰-home.jpg`。

## GitHub Pages 部署

默认部署方式：

1. 新建 GitHub 仓库，名字建议用 `laohe-wings-lineup`。
2. 把本项目推到 `main` 分支。
3. 打开仓库 `Settings` → `Pages`。
4. `Source` 选择 `Deploy from a branch`。
5. `Branch` 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub 生成地址。

如果使用本仓库里的 `.github/workflows/pages.yml`，也可以在 Pages 里选择 `GitHub Actions` 作为部署来源。

## Cloudflare Pages 部署

1. 登录 Cloudflare，进入 `Workers & Pages`。
2. 选择 `Create application` → `Pages` → `Connect to Git`。
3. 选择这个仓库。
4. 构建命令留空。
5. 输出目录填 `/`。
6. 部署完成后，Cloudflare 会给一个 pages.dev 地址。

## 致谢

感谢浙江大学老和山之翼的每一位队员、领队、教练和绝版人物。这个页面保留了原版单文件海报生成器的核心体验，并把数据和图片拆出来，方便大家一起维护球员卡。
