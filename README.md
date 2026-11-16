# Resume Studio · 简历工作台

纯前端、无服务器、无账号、无外部依赖。双击 index.html 即可使用；也支持 GitHub Pages。仅附虚构示例，不含作者个人简历。

## 使用
编辑、缩放、分组、多选、拖动、撤销、模板排序等功能沿用工作台。＋ 导入 JSON；导出 JSON 可备份或交给 AI。AI 不会自动访问本机，请主动提供 JSON 并要求保留结构，修改后导入为新副本。

数据存在当前浏览器 localStorage。不同电脑/浏览器独立；同一浏览器共用网站会共享存储。清除浏览器数据会删除简历。请定期下载 JSON。同一网址最多约数 MB 存储空间，保存失败会提示。

PDF 使用浏览器打印：选择另存为 PDF、A4、100%、无页眉页脚。本版不包含本地 Python PDF 识别；仅支持工作台 JSON 导入。字体使用操作系统中文字体，跨设备字形与换行可能略有不同。

## GitHub Pages
在仓库根目录上传本包所有文件。在仓库 Settings → Pages 中选择从分支发布，选择 main / root，保存。不要上传原本 resume_workbench 目录，它含私人简历和浏览器缓存。

建议仓库名 resume-studio。GitHub 账号 celia628 下启用 Pages 后，预期地址为 https://celia628.github.io/resume-studio/（尚未部署）。
