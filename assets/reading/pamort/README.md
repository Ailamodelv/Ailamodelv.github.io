# PAMORT 论文精读资料

整理日期：2026 年 10 月 20 日

本文延续 HDPG 精读，记录偏好条件策略、两阶段训练、权重调节器的固定外层奖励，以及运输实验和研究启发。

博客文章：[PAMORT 四足机器人自主调权与堆叠载物运输论文精读](https://xiaoyong-daydayup.github.io/posts/pamort-payload-reading/)

## 文件说明

| 文件 | 用途 |
|---|---|
| `pamort_literature_reading.md` | 可编辑的精读正文，图片位于相邻的 `assets/` 文件夹 |
| `pamort_reading.html` | 独立离线阅读版，已内嵌图片、公式和数学字体 |
| `assets/01-two-stage-framework.png` | 原论文图 2 的两阶段训练框架 |
| `assets/02-online-preference.png` | 原论文图 6 的在线偏好与躯干俯仰角轨迹 |
| `assets/03-real-world-results.png` | 根据原论文表 VI 重绘的成功次数比较 |
| `assets/03-real-world-results.svg` | 成功次数图的矢量版本 |
| `real_world_results.csv` | 图表对应的八项真机实验数据 |
| `references.bib` | 五条相关文献的 BibTeX 记录 |
| `SOURCES.md` | 正文、配图和数据来源 |
| `KATEX-LICENSE.txt` | 离线阅读版使用的 KaTeX 许可 |

本地文件夹另存 `PAMORT_Namura_2026.pdf` 原论文和 `讨论原稿.md`。公开下载包包含精读笔记及配图，论文全文可从正文的 arXiv 链接访问。

## 后续使用

直接双击 `pamort_reading.html` 可离线阅读。修改笔记时编辑 Markdown 文件，并保留 `assets/` 的相对位置。上传到其他博客时，按平台要求替换图片地址，并启用 `$...$`、`$$...$$` 数学公式渲染。

方法与实验以 arXiv:2610.05819v1 为准。原论文图和数据归原作者所有，重绘图在正文中标明出处；文章中的教学例子与分析判断不属于作者的实验测量。
