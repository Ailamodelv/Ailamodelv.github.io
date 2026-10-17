# 具身手记 · Embodied Notes

记录自己在人形机器人领域学习过程的个人博客。栏目为「基础知识学习」「文献分享」「debug 经历」「观点闲谈」，每个栏目都有独立页面，包括暂时没有文章的栏目。采用白底黑字、单栏排版，支持栏目浏览、标题与正文搜索、RSS 订阅和代码复制。

**第一次写文章，请直接看 [写作指南](WRITING.md)。** 直接写正文就能发布，不需要模板，也不需要运行命令。

博客是纯静态网站，使用 Node.js 标准库生成 HTML，不依赖数据库、后端服务或第三方构建包。文章以 Markdown 保存在仓库中，GitHub Actions 自动生成并发布到 GitHub Pages。

- 博客地址：[具身手记](https://xiaoyong-daydayup.github.io/)
- 源码仓库：[xiaoyong-daydayup.github.io](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io)

博客仅展示正式记录。新的学习计划和阶段复盘可直接写入「观点闲谈」。

## 直接在 GitHub 上更新

日常写作可以完全通过 GitHub 网页完成，无需在电脑上安装编辑工具。

1. 打开仓库的 [`content/posts/`](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/tree/main/content/posts) 目录。修改已有文章时，打开文件并点击铅笔图标；新建文章时，选择 **Add file → Create new file**。
2. 文件名填写 `今天的学习记录.md`，直接写正文。支持中文、英文和空格，也支持 `.txt` 或没有后缀；标题、日期和默认栏目会自动补齐。
3. 点击 **Commit changes**，提交到 `main` 分支。到 [Actions](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/actions) 查看自动发布，绿色完成后刷新博客即可。

博客名称、简介、署名和栏目设置都在 [`site.config.json`](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/blob/main/site.config.json)。上传实验图片时，可放到 `assets/images/`，在文章中写 `![实验图片说明](/assets/images/文件名.png)`。

## 本地运行

安装 [Node.js 22 或更新版本](https://nodejs.org/)，在项目目录运行：

```powershell
node scripts/serve.mjs
```

浏览器打开 <http://127.0.0.1:4321>。预览命令会先构建网站；修改文章或页面后，停止预览并重新运行，然后刷新浏览器。

```powershell
# 只生成网站，输出到 dist/
node scripts/build.mjs

# 运行生成器检查
node --test scripts/*.test.mjs
```

无需运行 `npm install`。如果本机有 npm，也可以使用 `npm run dev`、`npm run build` 和 `npm test` 作为便捷命令。

## 写一篇笔记

在 `content/posts/` 下新建文件，例如 `今天的学习记录.md`，直接写正文即可。不需要开头设置：标题默认使用文件名（或正文开头的 `# 标题`），日期使用 Git 中该文件首次提交的日期，栏目默认为「观点闲谈」。本地未提交的文件暂用修改日期。文件名支持中文、英文和空格，会成为文章网址的一部分；空格和标点自动转为连字符，同名网址会提示冲突。

下面是**可选**的完整设置示例，需要自定义时才填写其中的项目，也可以只保留 `category` 一行指定栏目：

```markdown
---
title: 我的第一次单关节仿真
date: 2026-10-16
category: 基础知识学习
tags: 仿真, 控制, 入门
summary: 这次我设置了什么条件，观察到什么，以及还有什么没有理解。
readingTime: 5
draft: true
sample: false
---

## 这次要回答的问题

写下一个具体问题。

## 条件与过程

- 使用的模型与参数
- 做出的修改
- 实际观察到的结果

## 复盘与下一步

区分观察结果、个人推测和待验证的问题。
```

将 `draft` 改为 `false` 即可在网站显示这篇文章；`draft: true` 仅从网站隐藏文章，公开仓库中仍可查看源文件。`sample: true` 会显示示例标记；省略 `readingTime` 时会自动估算阅读时间。日期采用 `YYYY-MM-DD` 格式，标签用逗号分隔。文章按日期倒序排列。

`category` 必须与配置中的栏目名称完全一致。目前可填 `基础知识学习`、`文献分享`、`debug 经历`、`观点闲谈`。文献笔记可记录论文出处、阅读批注和疑问；debug 笔记可记录环境、报错、排查步骤、修复结果与遗留问题。栏目为空时会如实显示“这个栏目还没有记录”。

支持标题、段落、无序列表、有序列表、引用、围栏代码块、行内代码、加粗、链接、图片和简单管道表格。原始 HTML 会显示为文字，暂不解析数学公式、合并表格单元格或嵌套列表。

将实验截图或曲线图片放入 `assets/`，然后用以下语法引用。图片只接受本地 `assets` 路径或 HTTPS 地址；本地路径会自动适配 GitHub Pages 的仓库子路径。文件名建议使用字母、数字与连字符，避免空格和括号。

```markdown
![单关节位置响应曲线](/assets/joint-response.png)

| 参数 | 取值 |
| :--- | ---: |
| Kp | 20 |
| Kd | 2 |
```

表格需要表头及至少三个连字符的分隔行，每行列数保持一致。使用 `\|` 在单元格内写管道符；行内代码中的管道符会保留。

独立学习计划的数据位于 `content/roadmap.json`，当前为空；日常学习计划和阶段复盘可直接写入「观点闲谈」。

## 修改博客信息

编辑 `site.config.json`：

| 字段 | 用途 |
| --- | --- |
| `title` | 博客名称 |
| `categories` | 栏目列表，每项含 `slug`（网址中的英文短名）、`title`（栏目名称）、`description`（说明） |
| `description` | 博客简介 |
| `author` | 作者署名 |
| `github` | GitHub 用户名，例如 `octocat`，无则留空，不填写完整链接 |
| `repoUrl` | 此博客仓库的完整链接，无则留空 |
| `url` | 网站域名，例如 `https://你的用户名.github.io`，不包含仓库路径 |
| `basePath` | 用户主页仓库填 `""`；普通仓库如 `robot-notes` 则填 `"/robot-notes"` |
| `language` | RSS 的语言代码，默认 `zh-CN`；当前页面模板使用中文 |

GitHub Actions 部署时会从 GitHub Pages 获取真实域名和仓库路径并覆盖 `url`、`basePath`，因此个人主页仓库和普通项目仓库都能使用。同样可以用 `SITE_URL` 与 `BASE_PATH` 环境变量覆盖本地配置。

```powershell
# 本地检查普通项目仓库的路径兼容性
$env:BASE_PATH = "/robot-notes"
node scripts/serve.mjs

# 恢复根路径预览
Remove-Item Env:BASE_PATH
```

`url` 留空时，本地生成的 RSS 和站点地图暂用 `http://localhost:4321`。正式发布的工作流会替换为 GitHub Pages 的真实网址。

## 发布到新的 GitHub 仓库

1. 在 GitHub 上创建一个公开仓库。可命名为 `robot-notes`；若想使用 `https://你的用户名.github.io/` 作为网站地址，仓库名必须为 `你的用户名.github.io`。
2. 将项目文件上传或推送到仓库的 `main` 分支。不要上传 `.tools/`、`dist/` 或任何凭据。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
4. 在仓库的 **Actions** 页面查看 **Deploy blog to GitHub Pages**。若上传早于 Pages 设置，请手动点击 **Run workflow** 再运行一次。
5. 工作流成功后，在 **Settings → Pages** 或工作流部署结果中打开博客网址。网站通常需要等待片刻才可访问。

仓库已包含 `.github/workflows/deploy.yml`，后续每次推送到 `main` 都会自动检查、构建和发布。构建产物包含 `.nojekyll`、`404.html`、`rss.xml`、`sitemap.xml` 和 `robots.txt`。

如已安装并登录 GitHub CLI，可用下面的命令创建仓库。请先将 `你的用户名` 和仓库名替换为自己的信息，并确认该名称尚未使用。

```powershell
git init
git add .
git commit -m "Create personal robotics learning blog"
git branch -M main
gh repo create 你的用户名/robot-notes --public --source . --remote origin --push
```

发布步骤遵循 [GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。工作流依赖 GitHub 仓库启用 Actions 与 Pages；本项目本身不表示网站已经上线。

## 文件结构

```text
assets/                   样式、交互脚本与插图
content/posts/            Markdown 笔记
content/roadmap.json      学习路线
src/templates.mjs        页面模板
scripts/build.mjs        静态生成器
scripts/markdown.mjs     安全的 Markdown 子集解析
scripts/serve.mjs        本地预览
scripts/build.test.mjs   生成与安全检查
site.config.json         博客配置
.github/workflows/       GitHub Pages 发布工作流
dist/                    自动生成的网站（不提交）
```

## 许可

源代码采用 MIT 许可，见 `LICENSE`。你添加的个人文章、图片及引用资料由你决定其许可方式；引用其他人的材料时请保留来源并确认使用权限。
