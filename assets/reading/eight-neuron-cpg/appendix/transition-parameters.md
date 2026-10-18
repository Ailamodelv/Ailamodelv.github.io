# 附录：二十种步态转换的策略、刺激参数与等待窗口

[返回精读正文](../article.md#s10)

本附录整理 Liu 等论文第 4 节及附录 C 的具体设置，并与作者公开代码的固定提交 `cef012f12fed7316e307034d48f9c13df909de15` 核对。页码指 26 页 online-first 全文：策略解释在第 8–10 页，刺激参数与等待窗口在第 19–21 页。这里列出的是本文所用网络与参数下的配置，不是适用于任意机器人和任意 CPG 的通用参数表。[论文 DOI](https://doi.org/10.1177/02783649251364286)；[固定版本的切换实现](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/implementations.py)。

## 1. 先分清四种策略

四种策略都涉及采用目标步态的动力学参数；区别在于是否选择执行时机，以及是否对选定节点增加短时刺激。

| 策略 | 等待合适阶段 | 短时刺激 | 操作含义 |
|---|---|---|---|
| Switch | 否 | 否 | 直接改变步态控制参数 |
| Power Pair | 否 | 是 | 在改变步态参数的过程中，短时增强两个选定髋节点的驱动 |
| Wait & Switch | 是 | 否 | 等待成功窗口，再改变步态参数 |
| Wait & Power Pair | 是 | 是 | 等待成功窗口，再执行含短时刺激的切换 |

“等待”不是将神经状态暂停：系统继续按当前规则运动，直到进入所选窗口。“刺激”是改变神经模型的驱动参数，不是直接增加某两个关节的电机力矩。原文是在所观察到的失败机制基础上选用这些组合，没有证明四种组合穷尽所有可能的切换方法。[论文 §4.2、附录C](https://doi.org/10.1177/02783649251364286)。

## 2. 完整的源步态—目标步态矩阵

**行表示切换前，列表示切换后。** 五步态之间共有 $5\times4=20$ 个有向转换，不包括保持原步态。

| 源 → 目标 | Walk | Trot | Pace | Bound | Pronk |
|---|---|---|---|---|---|
| Walk | — | Wait & Switch | Wait & Switch | Switch | Switch |
| Trot | Switch | — | Wait & Switch | Switch | Switch |
| Pace | Switch | Wait & Switch | — | Switch | Switch |
| Bound | Wait & Power Pair | Wait & Power Pair | Wait & Power Pair | — | Switch |
| Pronk | Power Pair | Wait & Power Pair | Wait & Power Pair | Power Pair | — |

各策略对应的转换数为：Switch 9 种，Power Pair 2 种，Wait & Switch 4 种，Wait & Power Pair 5 种。该分配可在公开实现的 `set_strategy()` 中逐项核对。[代码](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/implementations.py)。

### 为什么反向切换不能直接照搬？

例如，Walk→Pronk 使用 Switch，而 Pronk→Walk 使用 Power Pair；Walk→Trot 需要等待，Trot→Walk 则直接切换。

从动力系统看，A→B 是从 A 当前轨道上的状态出发，采用通向 B 的演化规则。B→A 的出发状态、原有同步分组和目标规则都发生了变化，它并不是将 A→B 的过程按时间倒放。因此，某个方向无需额外刺激，并不意味着反方向也无需刺激。这是对表中不对称分配的机制解释；具体采用哪种策略仍以论文对该网络的数值试验为依据。

还要区分“神经信号可以切换”与“机器人身体切换成功”。这张策略表不代表二十种身体转换都达到 100% 成功率；身体仿真的完整成功率见[正文第 11.3 节](../article.md#s11)。

## 3. Power Pair 的符号和七组参数

### 3.1 节点编号

本附录中的刺激节点均为上层髋屈伸节点，编号从 1 开始：

| 节点 | 对应关节 |
|---|---|
| 1 | 左后髋屈伸 |
| 2 | 右后髋屈伸 |
| 3 | 右前髋屈伸 |
| 4 | 左前髋屈伸 |

因此，1、3 是一组对角节点；1、4 是左侧节点；1、2 是两条后腿的节点。目标 Trot 的同步组合为 $(13)(24)$，Pace 为 $(14)(23)$，Bound 为 $(12)(34)$。这一对应按原文表 1 与附录 C 的刺激节点清单整理。[论文表1、附录C](https://doi.org/10.1177/02783649251364286)。

### 3.2 刺激参数的含义

| 符号 | 含义 | 单位或范围说明 |
|---|---|---|
| $f^h$ | 髋层神经模型的驱动幅值参数；选定节点在刺激时采用临时增强值 | 不是关节角，也不是直接施加的电机力矩 |
| $R_P$ | 刺激增益比 | 无量纲 |
| $T_P$ | 刺激的总持续时间 | 秒 |
| $T_R$ | 刺激上升沿持续时间 | 秒 |
| $T_F$ | 刺激下降沿持续时间 | 秒 |
| $\eta_R=T_R/T_P$ | 上升沿占总时长的比例 | 无量纲 |
| $\eta_F=T_F/T_P$ | 下降沿占总时长的比例 | 无量纲 |

刺激结束后，驱动回到目标步态的正常设置。原文附录 C 使用经过平移、缩放的对数曲线构造上升沿和下降沿；以下只列原始参数及其时间含义，不将其另行改写成未经核查的连续刺激公式。[论文附录C、式16](https://doi.org/10.1177/02783649251364286)。

### 3.3 七组刺激配置

| 转换 | 策略 | 刺激节点 | $R_P$ | $T_P$ / s | $\eta_R$ | $\eta_F$ |
|---|---|---|---:|---:|---:|---:|
| Pronk→Walk | Power Pair | 1、3 | 2.0 | 0.10 | 0.1 | 0.1 |
| Pronk→Bound | Power Pair | 1、2 | 2.0 | 0.14 | 0.1 | 0.1 |
| Bound→Walk | Wait & Power Pair | 1、3 | 2.2 | 0.20 | 0.1 | 0.1 |
| Bound→Trot | Wait & Power Pair | 1、3 | 1.8 | 0.40 | 0.4 | 0.4 |
| Bound→Pace | Wait & Power Pair | 1、4 | 2.0 | 0.20 | 0.1 | 0.1 |
| Pronk→Trot | Wait & Power Pair | 1、3 | 2.6 | 0.07 | 0.1 | 0.1 |
| Pronk→Pace | Wait & Power Pair | 1、4 | 2.6 | 0.09 | 0.1 | 0.1 |

数据来自论文附录 C 第 19–20 页；公开代码对应 `init_powerpair_strategy()` 和 `set_powerpair_strategy()`。[代码](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/implementations.py)。

**一个直接的时间算例：** Pronk→Trot 的刺激总长为 $0.07$ s，上升沿与下降沿分别占 $0.1$，所以：

$$
T_R=T_F=0.1\times0.07=0.007\ \mathrm{s}=7\ \mathrm{ms}.
$$

其余时间为 $0.07-0.007-0.007=0.056$ s，即 56 ms。这里计算的是刺激各时段的长度；它不表示线性上升或线性下降，也不等于机器人完整切换和恢复所需时间。

## 4. Wait 所用的周期位置指标

论文利用节点 1 的信号和导数分支定义：

$$
F(x_1)=
\begin{cases}
x_1,&\dot x_1\ge0,\\
2-x_1,&\dot x_1<0.
\end{cases}
$$

这里 $x_1$ 是节点 1 的内部状态，$\dot x_1$ 是它的变化速度。虽然原文把函数简写为 $F(x_1)$，判断时实际还需要导数的符号。以相同的 $x_1=0.4$ 为例，上升分支得到 $F=0.4$，下降分支得到 $F=1.6$，因此可以区分这两个不同的周期阶段。[论文附录C、式17](https://doi.org/10.1177/02783649251364286)。

**$F$ 不是均匀增长的归一化相位。** 它使用当前波形高度和上升/下降分支，数值增长速度取决于波形；不能把 $F=0.6$ 直接说成周期进度 60%，也不能将 $F/2$ 当成已经证明正确的相位。

设计者先通过切换试验找出哪些 $F$ 区间产生所需结果。运行时收到命令后，检查是否已进入相应区间；若尚未进入，继续原来的节律，等待下一次进入。因而成功窗口是针对所选源步态轨道与转换配置建立的，不能自动推广到任意扰动后的波形或未校准参数。

## 5. 九个等待窗口

### 5.1 Wait & Switch：四个窗口

| 转换 | 原文给出的 $F(x_1)$ 成功窗口 |
|---|---|
| Walk→Trot | $[1.52,\ 1.70]$ |
| Walk→Pace | $[0.30,\ 0.56]$ |
| Trot→Pace | $[1.81,\ 1.84]$ |
| Pace→Trot | $[1.498,\ 1.615]$ |

### 5.2 Wait & Power Pair：五个窗口

| 转换 | 原文给出的 $F(x_1)$ 成功窗口 |
|---|---|
| Bound→Walk | $[0.56,\ 1.693]$ |
| Bound→Trot | $[0.58,\ 1.375]$ |
| Bound→Pace | $[1.82,\ 1.851]$ |
| Pronk→Trot | $[0.52,\ 0.70]$ |
| Pronk→Pace | $[1.75,\ 2.00]$ |

窗口来自论文附录 C 第 21 页。公开代码通过相邻 $x_1$ 数值的增减关系判断分支，再对 $x_1$ 施加相应区间条件；入口分别是 `set_wait_switch()` 与 `set_wait_powerpair()`。表中保留论文的区间写法，实际代码多使用严格不等式，复现时应以明确的采样约定和边界判断为准。[代码](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/implementations.py)。

例如，Walk→Trot 的 $F\in[1.52,1.70]$ 位于下降分支，此时 $F=2-x_1$，对应 $x_1\in[0.30,0.48]$，同时要求 $x_1$ 正在减小。只检查 $x_1$ 的范围而忽略升降分支，会选中错误的执行阶段。

原文图 12 展示过 Pronk→Trot 的具体例子：在 9.1 s 收到命令并立即执行时失败；仍在 9.1 s 收到命令，但等待至 9.1342 s 的成功窗口再执行时成功。这个例子中的等待为 34.2 ms，随后还要经历刺激和节律过渡；等待时长、刺激时长与整机恢复时长是三个不同的量。[论文附录C、图12](https://doi.org/10.1177/02783649251364286)。

## 6. 连续状态并不自动保证连续目标角

切换时保留神经状态，可以使 $x,y,z$ 在参数更换时保持连续。但执行网络的输入还包括数值导数和步态编码：

- 更换参数可能使 $\dot x$ 发生跳变。
- 当前步态的 one-hot 编码可能离散变化。
- 训练损失没有显式要求两种步态条件下的输出在切换点完全相接。

因此，不能只凭 $x$ 连续就推断目标角连续，更不能推断关节速度、力矩和接触力都平滑。固定步态且全部输入连续时，ReLU MLP 本身是连续映射；跨步态切换是否满足这个前提，需要检查完整输入与输出链。这是依据公开结构作出的机制分析，不是论文已经给出的通用平滑性证明。[MLP 实现](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/execution_neural_network/mlp.py)；[特征构造与推理](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/gait_and_transition/process_network.py)。

实际复现还应同时核对收到命令、真正执行换参/刺激、改变执行网络步态编码这三个时刻。普通演示中的 CPG 时间和截取后的机器人仿真时间不应混用，版本细节见[来源与复现说明](../source-notes.md)。

## 7. 直接查阅的原始来源

1. [Liu 等论文，DOI 10.1177/02783649251364286](https://doi.org/10.1177/02783649251364286)：§4、附录C、图9–12。
2. [Stein 网络及切换策略](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/implementations.py)：策略分类、刺激配置、等待判断。
3. [各步态的基本动力学参数](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/src/cpg_go1_simulation/stein/base.py)：`get_neuron_params()`。
4. [物理仿真的切换演示](https://github.com/ImDipsy/cpg_go1_simulation/blob/cef012f12fed7316e307034d48f9c13df909de15/examples/demo_video4_gait_transition.py)：读取 CPG 数据、构造执行网络输入、设置关节目标并推进仿真。

