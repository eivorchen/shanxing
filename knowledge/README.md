# 官方资料采集与批量入库

资料来源由 `sites.json` 管理。每个站点记录允许访问的域名、发布单位、核验依据、种子页面与采集上限。采集器从种子页面自动发现相关链接，提取正文、发布日期和内容哈希。

本批次新增40条资料，腾讯C端默认知识库由12份扩至52份；首页由14条扩至54条，涉及12处山岳与景区。B端应用与资料保留。

## 运行

```sh
python3 -m venv knowledge/.venv
knowledge/.venv/bin/pip install -r knowledge/requirements.txt
knowledge/.venv/bin/python knowledge/scripts/collect.py --refresh
node knowledge/scripts/build_catalog.mjs
```

`collect.py` 支持 `--sites hengshan lushan` 只更新指定来源，`--reparse` 重新解析本地快照。普通运行复用已有快照；`--refresh` 才重新请求网页。

新页面默认等待核验。核对正文、发布单位、发布日期、适用区域和活动期限后，在 `review.json` 写入摘要并记录 `reviewed_content_sha256`。正文变化时，构建器将该条送回待复核队列；抓取失败或等待复核时保留上次已核验的首页条目。已结束的临时活动、空正文、无关页面及标题正文冲突均不自动发布。

## 输出

- `outputs/approved.json`：正文与来源元数据。
- `docs/`：逐篇Markdown工作副本，包含原始网址、日期和适用范围。
- `outputs/import-urls.json`：扣除已入库来源后的新增网址。
- `data.js`：首页目录，从同一份核验清单生成。
- `import-ledger.json`：本批入库记录，供下次去重。

原始网页、完整正文工作副本和浏览器实测证据保存在本地，不随静态网站发布。

## 腾讯导入

`build_import_sheet.mjs` 使用腾讯控制台原始模板生成XLSX，单批最多500个网址。当前项目使用本机Codex提供的 `@oai/artifact-tool` 依赖运行该脚本。原始模板下载地址见本文末尾；模板文件保留于本地 `outputs/tencent-web-template.xlsx`。

控制台操作：C端应用 → 知识管理 → 导入 → 网页文件 → 批量上传。选择每日更新、原始网址引用、调试/发布都生效，完成抓取预览后全部保存到文档库。文档状态达到“导入完成”才记入入库台账。

本批40个网址一次上传并全部完成；定期刷新已设为每日更新，尚未观察跨日任务执行。首页目录在重新采集、核验、构建和部署后更新。

接口扩展可使用腾讯新版 `ImportDocList`，需先上传文件取得FileId，再分批提交。当前采用XLSX批量导入，不需要在前端保存腾讯密钥。

## 测试

```sh
node --test knowledge/tests/catalog.test.mjs
```

检查来源唯一性、白名单与正文哈希、山名别名、证书分类、新闻日期、空结果和导览排序。浏览器实测另记录页面交互与腾讯公开体验页真实问答。

## 官方文档

- 导入方式与限制：https://cloud.tencent.com/document/product/1759/112702
- 新版批量导入接口：https://cloud.tencent.com/document/product/1759/138130
- 查询文档处理状态：https://cloud.tencent.com/document/product/1759/138139
- 腾讯网址导入模板：https://cdn.xiaowei.qq.com/adp/assets//static/网页文件批量上传模版.xlsx
