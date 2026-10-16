# 如何新增一篇记录

日常写作直接在 GitHub 网页完成。你只需要填写一篇文本文件，提交后网站会自动更新。

## 第一步：打开文章目录

登录你的 GitHub 账号 `Ailamodelv`，打开 [文章目录 content/posts](https://github.com/Ailamodelv/Ailamodelv.github.io/tree/main/content/posts)，点击 **Add file → Create new file**（添加文件 → 新建文件）。

## 第二步：填写文件名与正文

文件名填写类似 `2026-10-16-my-note.md` 的英文名称；每篇文章使用不同的名字，保留末尾的 `.md`。文件名会成为文章网址的一部分，正文标题可以用中文。

将下面的模板完整复制到编辑框，修改标题、日期、栏目与正文。开头和中间两行 `---` 都要保留。

```markdown
---
title: 我的第一篇学习记录
date: 2026-10-16
category: 基础知识学习
draft: false
sample: false
---

今天主要记录……

## 我的理解

在这里写正文。

## 还没想明白的地方

在这里写疑问。
```

日期换成这篇记录的日期，格式为 `年-月-日`，如 `2026-10-16`。

`category:` 后面选择下面四个名称之一，写法和空格保持一致：

- `基础知识学习`
- `文献分享`
- `debug 经历`
- `观点闲谈`

`draft: false` 表示在博客显示；自己的正式记录保持 `sample: false`。可复用的模板也保存在 [templates/note.md](templates/note.md)。

## 第三步：提交，等待自动发布

点击 **Commit changes…**（提交更改），说明可以写“新增学习记录”，选择提交到 `main` 分支，然后再次点击 **Commit changes** 确认。

打开 [发布状态](https://github.com/Ailamodelv/Ailamodelv.github.io/actions/workflows/deploy.yml)，等最新一条显示绿色勾，再刷新 [博客](https://ailamodelv.github.io/)。同名栏目会自动出现这篇文章，首页也会按日期排列，无需修改网站代码。

如果没有出现文章，先看发布状态是否还在运行。若显示红叉，可把对应运行链接发给我排查；同时检查日期格式、栏目名称、两行 `---`，以及 `draft` 是否为 `false`。

## 修改已有文章

在 [文章目录](https://github.com/Ailamodelv/Ailamodelv.github.io/tree/main/content/posts) 打开文章，点击铅笔图标编辑，完成后同样点击 **Commit changes**。不要改文件名，就能保留原来的文章网址。

现有三篇示例可以直接改成自己的文章，同时把 `sample: true` 改为 `sample: false`。

## 正文常用写法

- 小标题：在一行开头写 `## 标题`。
- 列表：在一行开头写 `- 内容`。
- 链接：`[论文名称](https://论文地址)`。
- 加粗：`**需要强调的内容**`。

正文也支持代码块、图片和简单表格，更多写法见 [README](README.md#写一篇笔记)。

添加图片时，先在 [assets 目录](https://github.com/Ailamodelv/Ailamodelv.github.io/tree/main/assets) 点击 **Add file → Upload files** 上传图片并提交，再在文章里写：

```markdown
![图片说明](/assets/my-experiment.png)
```

将 `my-experiment.png` 换成上传的实际文件名，建议使用英文、数字和连字符。

`draft: true` 只会让文章不显示在网站，公开仓库中的源文件仍可见。

也可以直接把原始笔记发到当前聊天，告诉我标题和所属栏目，并说明“发布到博客”，我会帮你整理、提交和发布。

GitHub 网页操作可参照 [GitHub 官方新建文件说明](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files)。
