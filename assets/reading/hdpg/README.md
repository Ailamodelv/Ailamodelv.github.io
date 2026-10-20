# HDPG 文献精读：阅读与博客发布说明

## 文件内容

| 文件 | 用途 |
|---|---|
| `hdpg_literature_reading.md` | 完整中文精读正文，14 个主体章节，包含公式、实验表格和 24 条参考资料 |
| `hdpg_reading.html` | 独立离线阅读版，直接用浏览器打开，图片和阅读字体已内嵌 |
| `assets/01_control_loop.png` | AIDA 的控制闭环与训练反馈 |
| `assets/02_ac_to_hdpg.png` | DDPG、MHDDPG 与 HDPG 对比 |
| `assets/03_dynamic_weights.png` | 动态权重的计算与作用位置 |
| `assets/04_preference_control.png` | 自主偏好选择的概念性扩展架构 |
| `assets/*.svg` | 上述原创教学图的可编辑矢量版本 |
| `references.bib` | 与正文编号对应的 24 条 BibTeX 文献记录 |
| `assets/reading.css` | 离线阅读版样式 |
| `assets/reading-cjk.woff` | 离线阅读版使用的 Noto Sans CJK SC 字体子集 |
| `assets/OFL.txt` | Noto 字体的 SIL Open Font License |

## 发布到博客

1. 以 `hdpg_literature_reading.md` 作为正文，将它与 `assets/` 目录保持相邻；正文图片使用相对路径。
2. 若博客要求单独上传图片，上传四张 PNG 后，将正文中的 `assets/文件名.png` 替换成博客生成的图片地址。SVG 为可编辑备份，正文默认使用更易兼容的 PNG。
3. 开启博客的数学公式支持。正文使用 `$...$` 表示行内公式，使用 `$$...$$` 表示独立公式，可由支持此语法的 KaTeX 或 MathJax 配置渲染。
4. 正文没有强加某个博客框架的 YAML front matter。按你的平台补充作者、发布日期、分类、标签和封面即可；文首的“整理日期”表示本次文献核查时间。
5. 目录和文献引用使用显式 HTML 锚点，例如 `<a id="sec-1"></a>` 与 `<a id="ref-1"></a>`。若平台清理 HTML，需保留这些锚点或改为该平台支持的标题锚点。
6. 文末参考文献为普通 Markdown 链接，不依赖聊天界面的引用格式。`references.bib` 供文献管理器或后续学术写作使用。

`hdpg_reading.html` 是完整的便携预览，可单独下载和离线阅读。其公式使用原生 MathML，不依赖远程数学脚本；建议使用支持 MathML 的现代浏览器。它不要求与你的博客使用同一套样式。

## 内容范围

精读依据 Huang 等人的 TPAMI 正式版本，区分 2022 年在线发表与 2023 年卷期信息。相关研究核查截至 2026 年 10 月 20 日；PROMO、PAMORT 等新工作按当时可核实的预印本状态标注。

正文分别标明原论文事实、教学计算、分析与后续研究建议。式（9）存在原文方差符号歧义，教学例子采用的解释约定已在第 6.1 节说明。

四张示意图根据方法描述原创绘制，没有复用论文原图。包内不附论文全文 PDF。精读署名、博客许可及发布后的编辑维护由发布者自行设置；Noto 字体按随附 OFL 许可使用。

