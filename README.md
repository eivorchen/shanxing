# 山行 · 登山信息助手

面向普通徒步与景区登山爱好者的卡片首页，提供山岳资料、门票预约、开放公告、登顶证书、登山新闻和专业攀登六类入口。

在线访问：https://eivorchen.github.io/shanxing/

## 实现

原生 HTML、CSS、JavaScript，无构建步骤和第三方运行时依赖。页面中的公开资料摘要标注核验日期，详情链接到原发布机构。

- `index.html`、`style.css`：页面结构及样式。
- `app.js`：服务卡片、山名筛选、来源目录、问题整理与复制。
- `data.js`：资料条目、C端问答与B端俱乐部工作台的公开链接。
- `404.html`：未找到页面时返回首页；base 路径与仓库名 `/shanxing/` 对应。
- `.nojekyll`：直接发布静态文件。

## 与腾讯 ADP 的连接

C端问答：https://adp.cloud.tencent.com/webim_exp/#/chat/claw/qaVQCT

B端俱乐部工作台：https://adp.cloud.tencent.com/webim_exp/#/chat/claw/BifKtp

首页选定山名和事项后会生成并复制问题，在新窗口打开腾讯体验页。用户粘贴发送，由 ADP 的知识库、联网工具及模型处理，答案展示在腾讯页面。

当前连接方式为公开体验链接与剪贴板，未接入 ADP API。仓库中不包含 API 凭证、聊天记录或申请材料。

## 本地预览

在仓库目录执行：

```sh
python3 -m http.server 8047 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:8047/`。

## 发布与维护

GitHub Pages 从 `main` 分支的仓库根目录发布，提交并推送后会触发更新。

```sh
git add .
git commit -m "Update mountain information"
git push origin main
```

资料目录由 `knowledge/scripts/build_catalog.mjs` 生成。新增来源、核验摘要和适用范围统一记录在 `knowledge/review.json`，采集及导入方法见 [知识库维护说明](knowledge/README.md)。

当前首页有54条资料，涉及12处山岳与景区；腾讯C端知识库有52份文档。页面支持山名及景点别名筛选，新闻按资料核验日筛选近30天，赛事预告保留计划日期。B端俱乐部工作台保留。
