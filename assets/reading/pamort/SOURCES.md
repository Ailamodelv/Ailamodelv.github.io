# PAMORT 精读来源

## 正文

以 2026 年 10 月 20 日“奖励自适应强化学习方法”对话中关于 PAMORT 的两轮讨论为基础，按任务背景、方法、奖励、实验和研究启发合并整理。原始问答另存于本地 `讨论原稿.md`。

原论文：Namura 等，*Transporting Unsecured Stacked Payloads with a Quadrupedal Robot via Multi-Objective Reinforcement Learning*，arXiv:2610.05819v1，2026 年 10 月 5 日。

- [版本条目](https://arxiv.org/abs/2610.05819v1)
- [PDF 原文](https://arxiv.org/pdf/2610.05819v1)
- [HTML 原文](https://arxiv.org/html/2610.05819v1)

## 配图与数据

| 文件 | 出处与处理 |
|---|---|
| `01-two-stage-framework.png` | 用户提供的原论文第 3 页图 2，裁取图像区域，未改变图内内容 |
| `02-online-preference.png` | 用户提供的原论文第 8 页图 6，裁取图像区域，保留照片、两条曲线、时间轴和图例标记 |
| `03-real-world-results.png` / `.svg` | 依据原论文第 7 页表 VI 重绘；成功率乘以每组 10 次试验得到成功次数 |
| `real_world_results.csv` | 原论文表 VI 的八项条件，每项每种方法试验 10 次 |

原论文图 2、图 6 用于本篇批注式精读的对照阅读，著作权属于原作者。本资料包不改变其署名，也不将原图标作原创图。

## 数字核对

表 I 核对高层 WA 的六项固定奖励系数；§III-B 与 §IV-D 核对平滑损失及 80 ms 调权周期；表 IV、VI 核对仿真与真机结果。真机成功次数分别合计为 TAR* 54/80、PAMORT 68/80，绝对差为 17.5 个百分点。

正文第 4 节的状态与反馈例子为教学构造。固定偏好参照、训练预算和测试范围的讨论对应原论文 §IV 与 §V，不表示额外完成了机器人实验。
