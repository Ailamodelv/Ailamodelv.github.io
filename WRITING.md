# 如何新增一篇记录

不需要模板。新建一个文件，直接写正文，提交后就会自动发布。

## 三步发布

1. 登录 GitHub，点击 [新建文章](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/new/main/content/posts)。
2. 文件名填写 `今天的学习记录.md`，在下面直接写内容。中文、英文和空格都可以，每篇用不同的文件名。推荐 `.md` 后缀，也支持 `.txt` 或没有后缀。
3. 点击 **Commit changes**，提交到 `main`。等 [发布状态](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/actions/workflows/deploy.yml) 显示绿色勾，再打开 [博客](https://xiaoyong-daydayup.github.io/)。

例如，你可以只写：

```markdown
今天终于弄清楚了世界坐标系和机体坐标系的区别。

还有一个问题：旋转和平移的先后顺序会怎样影响结果？
```

网站会自动处理：

- **标题**：用文件名（去掉 `.md` 或 `.txt`）；如果正文第一行写了 `# 我的标题`，就用这一行。
- **日期**：用这篇文件首次提交的日期，之后修改正文不会改变它。尚未提交的本地预览暂用文件修改日期。
- **栏目**：默认归入「观点闲谈」。
- **发布**：直接显示为正式文章，无需填写 `draft` 或 `sample`。

文件名会影响文章网址。修改正文时保留文件名，就能保留链接。空格和标点会自动转换为连字符；如果两个名字生成同一网址，发布日志会提醒换一个名字。

## 可选：指定栏目

只有想放入其他栏目时，才需要在正文最前面加这三行：

```markdown
---
category: 基础知识学习
---

这里开始写正文。
```

栏目可以填 `基础知识学习`、`文献分享`、`debug 经历`、`观点闲谈`。也可以在两行 `---` 之间额外填写 `title: 自定义标题` 或 `date: 2026-10-16`。这些设置全是可选项，已有的完整模板仍然可以使用。

## 修改已有文章

打开 [文章目录](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/tree/main/content/posts)，点进文件，再点铅笔图标。改好后点击 **Commit changes**，网站会自动更新。

## 更新《强化学习的数学原理》课程

这门课程已放在「基础知识学习」下，拥有独立的[课程目录](https://xiaoyong-daydayup.github.io/courses/rl-math/)。

1. 打开 GitHub 上的[课程笔记文件夹](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/tree/main/content/courses/rl-math)。
2. 点击 **Add file → Upload files**，上传下一课的 Markdown。文件名以课次开头，例如 `02-贝尔曼公式.md`、`03-贝尔曼最优公式.md`。
3. 点击 **Commit changes**，等待发布完成。

不必填写模板或栏目。正文第一行写 `# 第二课：贝尔曼公式` 即可确定文章标题。网站会自动归入这门课程和「基础知识学习」，按文件名开头的数字排序，并更新课程目录、首页和上一课／下一课导航。修改已发布的笔记时，保留原文件名以保持文章网址不变。

## 想排版时再用 Markdown

普通文字直接写即可，以下格式按需使用：

- 小标题：`## 我的理解`
- 列表：一行开头写 `- 内容`
- 加粗：`**需要强调的内容**`
- 链接：`[论文名称](https://论文地址)`

添加图片时，在 [assets 目录](https://github.com/xiaoyong-daydayup/xiaoyong-daydayup.github.io/tree/main/assets) 点击 **Add file → Upload files** 上传，再在正文中写 `![图片说明](/assets/my-experiment.png)`，替换成实际图片文件名。图片文件名建议用英文且不含空格。

如果想暂时隐藏文章，可以在开头设置 `draft: true`；这只会从博客隐藏，公开仓库里的文件仍可见。

也可以把原始笔记发到当前聊天并说明“发布到博客”，由我帮你发布。

## 论文笔记里的公式与附件

公式可以直接保留 Markdown 写法：行内用 `$x_i$`，独立公式在上下各放一行 `$$`。网站会自动排版，不用另外截图。

也支持 GitHub 的保护式行内公式（美元符号内包一对反引号），以及语言标记为 `math` 的三反引号公式块。课程笔记原有的这两种写法可以直接保留。参考式链接，例如 `[课程][course]` 配合文末的 `[course]: https://...`，也会正常显示。

附件放入 `assets/downloads/`，正文用 `[下载附件](/assets/downloads/文件名.zip)` 链接。带图片、交互页和附录的整套资料可保留目录结构放入 `assets/reading/资料名/`，正文链接改为对应的 `/assets/reading/资料名/...` 路径。上传文件后仍需提交更改，网站才会更新。
