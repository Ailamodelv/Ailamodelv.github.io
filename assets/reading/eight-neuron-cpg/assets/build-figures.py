"""Rebuild the six publication-independent figures from bundled derived data.

Requirements: Python 3, numpy, matplotlib. Run from any working directory:
    python assets/build-figures.py --font /path/to/a/Chinese-font.ttf
Figures are original educational plots, not copied illustrations from the paper.
"""
from pathlib import Path
import argparse
import json
try:
    import numpy as np
    import matplotlib
except ModuleNotFoundError as exc:
    raise SystemExit(
        "缺少绘图依赖。请先运行：python -m pip install numpy matplotlib"
    ) from exc
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.ft2font import FT2Font

ROOT = Path(__file__).resolve().parent
COLORS = {"x": "#236C9E", "r": "#CA6334", "Y": "#4A8764", "Z": "#8064A5"}


def read(name):
    data = json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))
    return data, np.asarray(data["rows"], dtype=float)


def choose_chinese_font(explicit_path=None):
    """Pick an installed font with Chinese glyphs, or validate --font."""
    required = {ord(char) for char in "中文髋膝关节目标角周期振荡"}

    def covers_labels(path):
        try:
            return required.issubset(FT2Font(str(path)).get_charmap())
        except (OSError, RuntimeError, ValueError):
            return False

    if explicit_path is not None:
        explicit_path = explicit_path.expanduser()
        if not explicit_path.is_file():
            raise ValueError(f"--font 指定的字体文件不存在：{explicit_path}")
        if not covers_labels(explicit_path):
            raise ValueError("--font 指定的文件无法读取，或不包含本图需要的中文字符。")
        font_manager.fontManager.addfont(str(explicit_path))
        return font_manager.FontProperties(fname=str(explicit_path)).get_name()

    preferred = [
        "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC",
        "Microsoft YaHei", "PingFang SC", "Heiti SC", "WenQuanYi Micro Hei",
        "SimHei", "SimSun", "Arial Unicode MS",
    ]
    rank = {family: i for i, family in enumerate(preferred)}
    entries = sorted(font_manager.fontManager.ttflist,
                     key=lambda entry: (rank.get(entry.name, len(rank)), entry.name))
    seen = set()
    for entry in entries:
        if entry.fname in seen:
            continue
        seen.add(entry.fname)
        if covers_labels(entry.fname):
            return entry.name
    raise ValueError(
        "未找到包含所需中文字符的系统字体。请安装思源黑体 / Noto Sans CJK SC，"
        "或通过 --font 指定中文字体文件，例如："
        "python assets/build-figures.py --font /path/to/chinese-font.ttf。"
        "现有 PNG/SVG 无需重新生成即可阅读。"
    )


def style(ax):
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color("#777F85")
    ax.tick_params(colors="#36434B", length=3, pad=5)
    ax.grid(axis="y", color="#DDE3E8", linewidth=0.6)
    ax.set_axisbelow(True)


def save(fig, stem):
    fig.savefig(ROOT / f"{stem}.png", dpi=180, facecolor="white")
    fig.savefig(ROOT / f"{stem}.svg", facecolor="white")
    plt.close(fig)


def rhythm_fig(data, columns, stem, title, note):
    col = {k: i for i, k in enumerate(columns)}
    t0 = data[0, col["t"]]
    time = data[:, col["t"]] - t0
    x, r = data[:, col["x"]], data[:, col["r"]]
    Y, Z = data[:, col["Y"]], data[:, col["Z"]]
    fig, axes = plt.subplots(2, 1, figsize=(9.2, 6.9), sharex=True)
    fig.subplots_adjust(left=.105, right=.96, top=.845, bottom=.14, hspace=.31)
    fig.suptitle(title, x=.105, y=.965, ha="left", fontsize=17)
    fig.text(.105, .912, note, fontsize=11.3, color="#53646E")
    axes[0].plot(time, x, label="当前状态 x", color=COLORS["x"], lw=2.2)
    axes[0].plot(time, r, label="瞬时目标 r", color=COLORS["r"], lw=1.8, ls="--")
    axes[0].fill_between(time, x, r, where=r >= x, color=COLORS["x"], alpha=.085)
    axes[0].fill_between(time, x, r, where=r < x, color=COLORS["r"], alpha=.07)
    axes[0].set_ylabel("内部数值")
    axes[0].set_ylim(-.035, 1.21)
    axes[0].set_title("a  r 高于 x 时，x 增大；r 低于 x 时，x 减小", loc="left", fontsize=12, pad=9)
    axes[0].legend(loc="upper right", frameon=False, fontsize=10.5, ncol=2)
    for key, series, label, line in [
        ("x", x, "X = x", "-"), ("Y", Y, "Y = 10y", "--"), ("Z", Z, "Z = 30z", "-.")
    ]:
        axes[1].plot(time, series, lw=2, label=label, color=COLORS[key], ls=line)
    axes[1].set_ylabel("缩放后的内部数值")
    axes[1].set_xlabel(f"图示区间内的时间 / s（绝对起点 t = {t0:.4f} s）", labelpad=9)
    axes[1].set_title("b  Y、Z 都随 X 变化，但响应速度不同", loc="left", fontsize=12, pad=9)
    axes[1].legend(loc="upper right", frameon=False, fontsize=10.5, ncol=3)
    axes[1].set_ylim(min(0, min(x.min(), Y.min(), Z.min())) - .02,
                     max(x.max(), Y.max(), Z.max()) + .16)
    axes[1].set_xlim(0, time[-1])
    for ax in axes:
        style(ax)
    fig.text(.105, .038, "x、y、z 是计算模型的内部状态；r 不是关节角，也不是显式相位参数。", fontsize=10.7, color="#53646E")
    save(fig, stem)


def ideal_phases():
    # Paper convention: positive phi advances the waveform, xi(t)=x1(t+phi*T).
    # The event-axis coordinate is instead d=(-phi) mod 1, the peak delay.
    gaits = [
        ("Walk", [0, .5, .25, .75]),
        ("Trot", [0, .5, 0, .5]),
        ("Pace", [0, .5, .5, 0]),
        ("Bound", [0, 0, .5, .5]),
        ("Pronk", [0, 0, 0, 0]),
    ]
    legs = ["左后 LH", "右后 RH", "右前 RF", "左前 LF"]
    fig, ax = plt.subplots(figsize=(9.2, 8.6))
    fig.subplots_adjust(left=.265, right=.94, top=.867, bottom=.13)
    fig.suptitle("五种步态的理想峰值时序", x=.085, y=.965, ha="left", fontsize=17)
    fig.text(.085, .920, "实心点：峰值延迟 d；空心点：下一周期重复事件。", fontsize=11.3, color="#53646E")
    ticks, labels = [], []
    for gi, (gait, advances) in enumerate(gaits):
        delays = [(-phi) % 1 for phi in advances]
        base = (4-gi)*5
        for i, delay in enumerate(delays):
            y = base + 3 - i
            ticks.append(y); labels.append(legs[i])
            ax.plot([0, 1], [y, y], color="#CFD7DC", lw=.7)
            ax.scatter([delay], [y], s=65, color=COLORS["x"], zorder=3)
            if delay == 0:
                ax.scatter([1], [y], s=65, facecolor="white", edgecolor=COLORS["x"], zorder=3, linewidth=1.4)
        ax.text(-.39, base+1.5, gait, ha="left", va="center", fontsize=13, color="#283D49", clip_on=False)
        if gi != 4:
            ax.axhline(base-.9, color="#E5EAEE", lw=.8)
    for value in [.25, .5, .75]:
        ax.axvline(value, color="#DAE1E6", lw=.8, ls="--", zorder=0)
    ax.set_yticks(ticks, labels, fontsize=11.5)
    ax.tick_params(axis="y", length=0, pad=9)
    ax.set_xticks([0,.25,.5,.75,1], ["0", "¼", "½", "¾", "1"])
    ax.set_xlabel("峰值事件在周期内的出现时间 / T", labelpad=9)
    ax.set_xlim(-.025,1.025); ax.set_ylim(-.65,24)
    for sp in ax.spines.values():
        sp.set_visible(False)
    fig.text(.085, .027, "φ 为提前量，d = (−φ) mod 1 为峰值延迟；不编码支撑占空比或足地接触。", fontsize=10.7, color="#53646E")
    save(fig, "02-gait-phase")


def joint_targets(rows):
    t = rows[:, 0] - rows[0, 0]
    fig, axes = plt.subplots(2, 1, figsize=(9.2, 6.8), sharex=True)
    fig.subplots_adjust(left=.12, right=.96, top=.84, bottom=.14, hspace=.35)
    fig.suptitle("每个控制步输出一个目标角，连续计算形成轨迹", x=.12, y=.965, ha="left", fontsize=16)
    fig.text(.12, .91, "完整八节点 Walk · 左后腿 · 步幅 1.0 · 作者公开权重重算", fontsize=11.2, color="#53646E")
    selected = 65
    for ax, idx, label, color in [(axes[0], 7, "髋关节目标角 / °", COLORS["x"]), (axes[1], 8, "膝关节目标角 / °", COLORS["r"])]:
        ax.plot(t, rows[:, idx], color=color, lw=1.9)
        ax.scatter(t, rows[:, idx], color=color, s=5, alpha=.42)
        ax.axvline(t[selected], color="#62737D", ls="--", lw=.9)
        ax.scatter(t[selected], rows[selected, idx], s=57, color=color, zorder=5, edgecolor="white", linewidth=1)
        y=rows[selected,idx]
        ax.set_title(f"当前一次输出 {y:.2f}°（竖虚线所示时刻）",loc="left",fontsize=11.5,pad=10)
        ax.set_ylabel(label)
        ax.margins(y=.25)
        style(ax)
    axes[-1].set_xlim(0,t[-1]); axes[-1].set_xlabel("图示区间内的时间 / s（绝对起点 t = 10.594 s）",labelpad=8)
    fig.text(.12,.038,"圆点间隔 2 ms。这里是给底层控制器的目标值，不是下一时刻必然达到的实测角度。",fontsize=10.6,color="#53646E")
    save(fig,"03-joint-targets")


def pair_loop(rows):
    rows=rows[:130]
    qh,qk=rows[:,7],rows[:,8]
    crossings=[]
    for i in range(len(rows)-1):
        if (qh[i]-60)*(qh[i+1]-60)<0:
            f=(60-qh[i])/(qh[i+1]-qh[i])
            crossings.append((rows[i,0]+f*(rows[i+1,0]-rows[i,0]),qk[i]+f*(qk[i+1]-qk[i]),qh[i+1]>qh[i]))
    fig,ax=plt.subplots(figsize=(9.2,6.6))
    fig.subplots_adjust(left=.13,right=.94,top=.83,bottom=.16)
    fig.suptitle("同一个髋角，可以对应不同的膝角",x=.13,y=.965,ha="left",fontsize=17)
    fig.text(.13,.912,"同一数据的角度对轨迹 · 每个点是同一时刻的一对目标角 · 约一个周期",fontsize=11.1,color="#53646E")
    ax.plot(qh,qk,color=COLORS["x"],lw=2.2)
    ax.scatter(qh[0],qk[0],color=COLORS["x"],marker="s",s=31,zorder=3)
    for i in [25,70,103,119]:
        ax.annotate("",xy=(qh[i+2],qk[i+2]),xytext=(qh[i-2],qk[i-2]),arrowprops={"arrowstyle":"->","color":COLORS["x"],"lw":1.9})
    ax.axvline(60,color="#9AA8B1",ls="--",lw=1)
    for label,(time,knee,rising) in zip(["A","B"],crossings):
        ax.scatter(60,knee,s=68,color=COLORS["r"],zorder=4,edgecolor="white",lw=1)
        text=f"{label}  (60°, {knee:.2f}°)\n髋角{'增大' if rising else '减小'}，t={time:.6f} s"
        ax.annotate(text,(60,knee),xytext=(64,knee+(3.5 if rising else -9.0)),fontsize=10.9,
                    ha="left",va="center",arrowprops={"arrowstyle":"-","color":"#788791","lw":.8})
    ax.set_xlabel("髋关节目标角 / °",labelpad=8)
    ax.set_ylabel("膝关节目标角 / °",labelpad=8)
    ax.set_xlim(qh.min()-3,qh.max()+5)
    ax.set_ylim(qk.min()-7,qk.max()+8)
    style(ax)
    delta=abs(crossings[1][1]-crossings[0][1])
    fig.text(.13,.052,f"A、B 由相邻采样点线性插值；髋角同为 60°，膝角相差约 {delta:.2f}°。",fontsize=10.8,color="#53646E")
    save(fig,"04-hip-knee-pair")


def ik_branches():
    cases=[("完整解 A",0,90), ("完整解 B",90,-90), ("髋 A + 膝 B",0,-90), ("髋 B + 膝 A",90,90)]
    fig,axes=plt.subplots(2,2,figsize=(9.2,8.2))
    fig.subplots_adjust(left=.085,right=.95,top=.825,bottom=.10,hspace=.48,wspace=.24)
    fig.suptitle("完整逆解可相容，拆开交叉组合通常不相容",x=.085,y=.965,ha="left",fontsize=16.3)
    fig.text(.085,.907,"教学双连杆：两杆长度 1；目标位置 (1, 1)。角度定义与 Go1 无关。",fontsize=11.2,color="#53646E")
    for n,(ax,(title,h,k)) in enumerate(zip(axes.flat,cases)):
        hrad,krad=np.deg2rad([h,k]);elbow=np.array([np.cos(hrad),np.sin(hrad)])
        foot=elbow+np.array([np.cos(hrad+krad),np.sin(hrad+krad)])
        ax.plot([0,elbow[0],foot[0]],[0,elbow[1],foot[1]],color=COLORS["x"],lw=4,solid_capstyle="round")
        ax.scatter([0,elbow[0]],[0,elbow[1]],s=45,facecolor="white",edgecolor=COLORS["x"],lw=1.8,zorder=3)
        ax.scatter(*foot,s=56,color=COLORS["x"],zorder=4)
        ax.scatter([1],[1],s=190,facecolor="none",edgecolor=COLORS["r"],marker="o",lw=1.8,zorder=5)
        ax.axhline(0,color="#C9D1D7",lw=.7,zorder=0);ax.axvline(0,color="#C9D1D7",lw=.7,zorder=0)
        fx,fy=np.rint(foot).astype(int)
        ax.set_title(f"{chr(97+n)}  {title}\n(qH, qK)=({h}°, {k}°) → ({fx}, {fy})",loc="left",fontsize=11.7,pad=9)
        ax.set_aspect("equal");ax.set_xlim(-1.35,1.35);ax.set_ylim(-1.35,1.35)
        ax.set_xticks([-1,0,1]);ax.set_yticks([-1,0,1]);ax.set_xlabel("水平位置 / 杆长",fontsize=10.3);ax.set_ylabel("竖直位置 / 杆长",fontsize=10.3)
        ax.grid(False)
        for sp in ax.spines.values():sp.set_color("#D7DFE4")
    fig.text(.085,.025,"橙色空心圆为同一个目标；蓝色实心点为给定角度对的末端位置。",fontsize=10.8,color="#53646E")
    save(fig,"05-ik-branches")


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font",type=Path,help="指定中文字体文件；省略时自动选择可用的系统中文字体。")
    args=parser.parse_args()
    for filename in ["single-node.json", "joint-targets.json", "full-network-node1.json"]:
        if not (ROOT / "data" / filename).is_file():
            parser.error(f"随包数据缺失：assets/data/{filename}。请先完整解压博客资源包。")
    try:
        family=choose_chinese_font(args.font)
    except ValueError as exc:
        parser.error(str(exc))
    plt.rcParams.update({"font.family":[family,"DejaVu Sans"],"font.size":12,"axes.titlesize":13,"axes.labelsize":12,
        "text.color":"#203744","axes.labelcolor":"#203744","xtick.labelsize":11,"ytick.labelsize":11,
        "axes.unicode_minus":False,"svg.fonttype":"path","savefig.pad_inches":.1})
    single,single_rows=read("single-node.json")
    rhythm_fig(single_rows,single["columns"],"01-single-node-rhythm","固定驱动下，单节点仍可产生振荡",
        "孤立单节点教学算例 · a=10，fci=40 恒定 · 不连接其他节点")
    ideal_phases()
    _,rows=read("joint-targets.json")
    joint_targets(rows)
    pair_loop(rows)
    ik_branches()
    full,full_rows=read("full-network-node1.json")
    rhythm_fig(full_rows,full["columns"],"06-full-network-rhythm","完整八节点网络中，节点 1 的状态怎样变化",
        "Walk · 左后髋节点 · 八节点同时用 RK4 积分 · h=0.0001 s")
    print("Saved six figures in PNG and SVG to",ROOT)


if __name__=="__main__":
    main()
