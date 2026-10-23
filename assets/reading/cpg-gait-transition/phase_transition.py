"""Four-leg phase-reference demonstration; no robot dynamics or learned policy.

Requires numpy and matplotlib. Run: python phase_transition.py --out output
Leg order: FL, FR, HL, HR. All internal angles use radians.
"""
from pathlib import Path
import argparse
import csv
import numpy as np


def simulate(dt=0.001, duration=4.0, gain=10.0):
    if dt <= 0 or duration < 3.5 or gain <= 0:
        raise ValueError("Use positive dt/gain and duration >= 3.5 s")
    times = np.arange(round(duration / dt) + 1) * dt
    theta = np.deg2rad([0.0, 180.0, 90.0, 270.0])
    records = []
    for t in times:
        u = np.clip(t - 2.0, 0.0, 1.0)
        blend = u * u * (3.0 - 2.0 * u)
        delta = np.deg2rad([0, 180, 90 + 90 * blend, 270 + 90 * blend])
        # Matrix row i, column j stores the j-minus-i difference.
        error = (theta[None, :] - theta[:, None]) - (delta[None, :] - delta[:, None])
        omega = 2 * np.pi + gain * np.sin(error).mean(axis=1)
        beta = 0.75 - 0.25 * blend
        phase = np.mod(theta, 2 * np.pi) / (2 * np.pi)
        swing = phase < 1 - beta
        progress = np.where(swing, phase / (1 - beta), (phase - (1 - beta)) / beta)
        ease = 0.5 * (1 - np.cos(np.pi * progress))
        x = np.where(swing, -0.05 + 0.10 * ease, 0.05 - 0.10 * ease)
        z = -0.25 + np.where(swing, 0.05 * np.sin(np.pi * progress)**2, 0.0)
        # Record all values at t BEFORE advancing the state to t + dt.
        records.append(np.r_[t, np.rad2deg(delta), np.rad2deg(theta - theta[0]),
                                np.rad2deg(omega), beta, swing.astype(float), x, z])
        theta = theta + dt * omega
    return np.array(records)


def save(data, folder):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    folder.mkdir(parents=True, exist_ok=True)
    legs = ["FL", "FR", "HL", "HR"]
    columns = (["time_s"] + [f"target_{leg}_deg" for leg in legs]
               + [f"relative_{leg}_deg" for leg in legs]
               + [f"omega_{leg}_deg_s" for leg in legs] + ["stance_fraction"]
               + [f"swing_{leg}" for leg in legs]
               + [f"x_{leg}_m" for leg in legs] + [f"z_{leg}_m" for leg in legs])
    with (folder / "phase-transition.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(columns)
        writer.writerows(data)
    with plt.rc_context({"font.size": 11, "axes.spines.top": False,
                         "axes.spines.right": False, "figure.facecolor": "#f6f8f5",
                         "axes.facecolor": "#f6f8f5"}):
        fig, axes = plt.subplots(3, 1, figsize=(10.5, 8.5), sharex=True,
                                 gridspec_kw={"height_ratios": [1.5, 1, 1]})
        t = data[:, 0]
        for idx, name, color in [(2, "HL", "#15734b"), (3, "HR", "#4e65aa")]:
            axes[0].plot(t, data[:, 1 + idx], "--", color=color, alpha=.65, label=f"{name} target")
            axes[0].plot(t, data[:, 5 + idx], color=color, linewidth=2, label=f"{name} actual")
        axes[0].set_ylabel("Relative phase (degrees)")
        axes[0].legend(ncol=2, loc="upper left")
        axes[0].set_title("Continuous gait-reference transition | illustrative phase model", loc="left", pad=18)
        axes[1].plot(t, data[:, 9], color="#a05f26", label="Front legs (FL / FR)")
        axes[1].plot(t, data[:, 11], color="#15734b", label="Hind legs (HL / HR)")
        axes[1].axhline(360, color="#89928a", linewidth=.8, linestyle=":")
        axes[1].set_ylabel("Phase speed (deg/s)")
        axes[1].legend(loc="upper right")
        for i, leg in enumerate(legs):
            axes[2].fill_between(t, i - .27, i + .27, where=data[:, 14 + i] < .5,
                                 color="#355e48", linewidth=0, step="post")
        axes[2].set_yticks(range(4), legs)
        axes[2].invert_yaxis()
        axes[2].set_ylabel("Planned stance")
        axes[2].set_xlabel("Time (s)")
        for ax in axes:
            ax.axvspan(2, 3, color="#dfbe66", alpha=.16)
            ax.set_xlim(0, 4)
            ax.grid(axis="x", alpha=.15)
        fig.text(.1, .015, "Shaded time: target transition. Stance bars are references, not measured ground contacts.", fontsize=10)
        fig.tight_layout(rect=[0, .035, 1, 1])
        fig.savefig(folder / "phase-transition.png", dpi=180)
        plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("output"))
    args = parser.parse_args()
    data = simulate()
    save(data, args.out)
    for t in (2.5, 3.0, 3.5):
        row = data[np.argmin(np.abs(data[:, 0] - t))]
        print(f"t={t:.1f}s target_HL={row[3]:.2f} actual_HL={row[7]:.2f} actual_HR={row[8]:.2f}")
    print(f"Phase-speed range: {data[:,9:13].min():.3f} to {data[:,9:13].max():.3f} deg/s")
    print(f"Maximum per-step reference displacement: {np.abs(np.diff(data[:,18:26],axis=0)).max():.8f} m")


if __name__ == "__main__":
    main()
