# Laohe Wings WeChat Mini Program

这是老和山之翼阵容工具的小程序初版骨架，数据源继续复用 CloudBase 文档型数据库 `lineups/current`。

## 当前范围

- 首页读取当前云端阵容，展示首发、替补、教练和领队。
- 抽卡页读取同一份阵容，并加入隐藏人物王泊乔。
- 关于页说明 H5 正式入口和后续迁移计划。

评论、图片上传、到场报名、MVP 投票会在下一阶段继续迁移到小程序端；H5 线上版仍是当前完整功能入口。

## 打开方式

1. 安装并打开微信开发者工具。
2. 选择“导入项目”，目录选中本仓库的 `miniprogram/`。
3. 把 `project.config.json` 里的 `appid` 替换成你自己的微信小程序 AppID。
4. 确认 CloudBase 环境为 `laohe-wings-lineup-d3cz65831519b`。
5. 编译运行。

如果没有正式 AppID，可以临时使用测试号体验页面，但真机、云开发和发布能力会受限制。

## 数据约定

小程序只读读取：

```text
collection: lineups
docId: current
field: snapshot
```

后续可直接复用 `publishLineup` 云函数动作提交互动数据，避免在小程序端暴露数据库写权限。
