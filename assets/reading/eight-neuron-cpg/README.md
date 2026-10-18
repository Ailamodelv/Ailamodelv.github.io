# 文献精读使用说明

本包是一篇面向初学者的完整精读，围绕 *An eight-neuron network for quadruped locomotion with hip-knee joint control*，按“控制量 → 单节点振荡 → 多节点相位 → 角度解码 → 髋膝配对 → 步态切换 → 实验与 RL 比较”的顺序展开。

## 1. 从哪里开始

- **在本地阅读：** 解压完整压缩包，双击 `index.html`。正文公式已经排版，无需安装插件或启动服务器。
- **编辑或发博客：** 使用 `article.md`，同时保留它所引用的图片、交互页和附录。
- **检查来源和复现范围：** 阅读 `source-notes.md` 与 `assets/figure-notes.md`。
- **查全部切换参数：** 阅读 `appendix/transition-parameters.md`。

使用说明、来源说明、图件说明与切换附录也附有同名 HTML。离线阅读版中的链接会打开已排版页面，各页导航可下载对应 Markdown 源文。

不要在压缩包预览窗口里直接打开 HTML；先解压，才能保持相对路径可用。正文、图片、公式字体和六个交互页均可离线使用；点击论文、代码或其他外部参考链接时才需要网络。

## 2. 文件对应关系

| 文件或目录 | 用途 |
|---|---|
| `article.md` | 博客正文，含目录、公式、图注、参考文献和普通相对链接 |
| `index.html` | 已排版的离线阅读版 |
| `assets/*.png` | 正文默认使用的六张静态图 |
| `assets/*.svg` | 对应的矢量图，文字已转成路径 |
| `assets/data/*.json` | 配图使用的教学数据和数值重算数据 |
| `assets/build-figures.py` | 根据随包数据重绘六张静态图 |
| `assets/figure-notes.md` | 逐图来源、参数、单位和数值解释 |
| `interactive/*.html` | 六个可独立打开的交互演示 |
| `appendix/transition-parameters.md` | 全部等待窗口与 Power Pair 参数 |
| `source-notes.md` | 固定代码版本、实现核查及未公开步骤 |
| `references.bib` | 原论文、代码及 RL 对比文献的 BibTeX 条目 |
| `vendor/` | 离线字体、前端库及其第三方许可证 |

## 3. 上传到博客

### 保持普通 Markdown 的做法

将 `article.md` 作为文章正文，把 `assets/`、`interactive/` 和 `appendix/` 放在能被正文相对链接访问的位置，同时放入 `source-notes.md`、`README.md`。如果博客会把文章和静态资源放到不同目录，请按实际访问地址批量修改相对链接。

正文使用标准 Markdown 图片、表格和普通链接，没有专属引用卡片。数学使用 `$...$` 和 `$$...$$`，需要博客的 Markdown 渲染器启用 KaTeX 或 MathJax 等数学支持。正文中的显式 HTML 锚点用于目录和参考文献定位；若平台过滤 HTML 锚点，可以按平台生成的标题锚点重建目录。

如果平台只支持文章和图片，可先发布正文与六张 PNG；把交互链接改成自己的静态托管地址，或保留为附件下载。不要只复制 Markdown 文本后省略图片上传，否则图会缺失。

### 使用交互演示

每个交互 HTML 都包含自己的脚本和数据，可以单独上传到可托管静态文件的位置。它们不需要账户、接口、CDN 或本地服务。

博客允许 iframe 时，可以使用这样的普通 HTML，路径按博客实际地址调整：

```html
<iframe
  src="./interactive/chasing-oscillation.html"
  title="完整八节点网络中的 x 与 r"
  loading="lazy"
  style="width:100%;height:980px;border:1px solid #dbe3ed;border-radius:12px;"
></iframe>
```

不同页面的高度不同，必要时调整 `height`。直接链接打开交互页的兼容性通常更好；若博客过滤 iframe，正文静态图仍能解释关键关系。

### 直接托管离线阅读版

如果博客支持上传完整静态目录，也可以将本包作为一个目录上传，以 `index.html` 为入口。请保持文件相对位置，特别是 `vendor/katex/` 与其字体子目录。

本包不附带博客账号或自动发布脚本。

## 4. 六个交互演示怎么用

| 页面 | 推荐观察的内容 |
|---|---|
| `single-neuron-rhythm.html` | 孤立节点中，X、慢响应 Y、快响应 Z 与移动目标 r 的关系 |
| `chasing-oscillation.html` | 完整八节点 Walk 信号中，r−x 如何决定 x 的瞬时增减；固定 r 的教学对照 |
| `gait-phase-rhythms.html` | 切换五种理想时序，区分相位提前量与峰值出现的时间 |
| `joint-target-step.html` | 拖动时间，查看当前 CPG 特征和当前关节目标角 |
| `hip-knee-pairing.html` | 在髋角—膝角平面追踪同时刻角度对，观察同一髋角对应不同膝角 |
| `ik-branch-pairing.html` | 比较完整逆解与交叉组合如何产生不同脚端位置 |

教学双连杆不是 Go1 的真实尺寸或角度定义；理想时序图不是实测足地接触图；真实权重演示展示的是目标角，均已在正文和图中注明。

## 5. 引用、修改与图件

正文将三类内容分开标识：论文或公开代码的事实、固定条件下的数值重算，以及帮助理解的教学例子。编辑或节选时，请保留这些说明，尤其不要把教学配对流程写成作者已公开的原始训练算法。

图件为本精读配套制作，未复制论文原图。作者的原论文 PDF、仓库源代码及模型权重不在本包中，入口位于正文参考文献；如需继续复现，请从所引用的原始来源获取。

随包保留了 KaTeX 与 D3 的许可证。只发布 PNG 和 Markdown 时不必依赖这些前端库；发布现成 HTML 或交互页时应保留相关许可证。

重绘图件需要 Python 3、NumPy、Matplotlib 和可用的中文字体，具体方法见 `assets/figure-notes.md`。仅阅读本包不需要 Python。

整理日期：2026 年 10 月 18 日。
