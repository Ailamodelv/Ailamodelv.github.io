---
title: 把训练留在 Linux：我的远程工作台
date: 2026-10-17
category: debug 经历
tags: 强化学习, 远程开发, Windows, Linux, SSH
summary: 把编辑入口、代理和训练环境的位置理清，再把重复的 SSH 操作收进一个可以随电脑迁移的小工具。
---

这次记录的是强化学习开发之前的环境准备：用 Windows 作为日常操作入口，把代码、依赖和训练任务留在 Linux 服务器上。换电脑时，重新建立连接，而不是重新搬一次训练环境。

**日常操作收敛为：打开代理 → 检测本机 → 连接服务器 → 在 VS Code 中打开项目。**

## 01 / 工作台长什么样

主界面只需要保存服务器地址、用户名和服务器代理入口。本机代理端口、VS Code 和 SSH 由工具检测；非常用参数放进高级设置。

![强化学习工作台主界面，显示示例服务器、自动检测结果和连接按钮](/assets/images/rl-workbench/main.png "图 1 · 便携版 2.0 的真实主界面，摄于 2026-10-18。当前仅完成本机检测，尚未连接服务器。点击图片可查看原图。")

[下载工作台便携版 · ZIP](/assets/downloads/rl-workbench-portable-2026-10-17.zip)

压缩包包含程序、源码、使用指南和验证记录。请解压整个文件夹，再打开 `RLWorkbench.exe`，不要只复制 EXE。

> 公开包与截图使用示例地址 `192.0.2.1`、用户名 `your-user`。首次使用请替换成自己的服务器信息。截图里的 `7890` 是拍摄时这台电脑检测到的端口，不是所有电脑都要填写的固定值。

## 02 / 我怎样划分 Windows 与 Linux 的工作

| 位置 | 保留什么 | 换电脑时怎么处理 |
| --- | --- | --- |
| Windows | VS Code 操作入口、代理软件、工作台 | 复制便携文件夹，重新检测本机环境 |
| Linux | 项目代码、Python 环境、训练进程、模型和日志 | 留在原服务器，不随 Windows 迁移 |
| SSH 通道 | 把服务器代理入口接到当前电脑 | 旧电脑断开，新电脑重新建立 |

```text
Linux 上需要联网的程序
    ↓ 使用 HTTP 代理
Linux 127.0.0.1:17890
    ↓ SSH 反向转发
当前 Windows 电脑的本机代理
    ↓
外网
```

这里提供的是 **HTTP 代理入口**。哪些请求走通道，取决于对应程序有没有配置代理；国内、国外的分流由当前电脑的代理规则决定。SSH Git、UDP、容器和系统服务不能假定自动走这条通道。

Windows 的网络断开会影响代理和在线 AI 功能。不依赖外网的训练可以继续留在服务器运行，但前提是它已经放进 `tmux` 或合适的任务调度器，并且所需依赖、资产已准备好。

## 03 / 日常使用：检测，再连接

首次准备好 Windows 10/11、Windows PowerShell 5.1 / .NET Framework 4.8、OpenSSH 客户端，以及安装 Remote-SSH 扩展的 VS Code。工作台会提示缺失项，不会自动安装系统组件。

1. 打开当前电脑的代理软件；校外需要校园 VPN 时，先连接 VPN。
2. 打开工作台，等待自动检测，也可以手动点击“一键检测本机”。
3. 首次填写自己的服务器信息，点击“保存服务器信息”。服务器代理入口按服务器上的配置填写，本次使用 `17890`。
4. 点击“连接服务器”，在弹出的 SSH 窗口里输入密码；首次连接核对管理员提供的主机指纹。
5. 网络检查完成后，进入自动打开的 VS Code 远程窗口，选择“打开文件夹”，再选择项目目录。

SSH 密码由系统 OpenSSH 在本地窗口询问，工作台不保存。VS Code 可能再询问一次密码。保留 SSH 窗口即可，可以将它最小化。

**“识别到代理”和“外网检测通过”是两件事。** 看到端口不等于网络已经可用；检测超时可以重试，连接之后也能重新检查服务器端的链路。

| 按钮 | 什么时候用 |
| --- | --- |
| 一键检测本机 | 初次打开、换电脑，或当前代理发生变化时 |
| 连接服务器 | 新建 SSH 和代理通道，并打开远程编辑入口 |
| 仅打开 VS Code | 已有通道，或只想查看服务器上的项目时 |
| 重新检查网络 | 已连接，但想确认服务器外网访问是否正常时 |
| 断开 | 结束工作台管理的代理连接，不会停止训练 |

### 高级设置：把不常改的参数收起来

SSH 端口是远程登录入口，通常为 `22`；服务器代理入口是转发端口，本次为 `17890`。这两个值用途不同。

![工作台高级设置，包含 SSH 端口、手动代理端口和 VS Code 路径](/assets/images/rl-workbench/advanced.png "图 2 · 高级设置的真实界面。SSH 端口、手动代理端口和 VS Code 路径集中在这里，日常一般不需要修改。")

如果代理没有被识别，可以在这里填写实际的本机 HTTP / 混合代理端口。只提供 PAC 或 SOCKS、需要代理账号，或代理软件未开启时，工具未必能自动找到可用的 HTTP 入口。

项目目录交给 VS Code 选择。它决定编辑哪个项目，不是建立 SSH 和代理通道所必需的字段。

## 04 / 换一台电脑，怎样继续

1. 在旧电脑点击“断开”；使用旧版专用 SSH 窗口时，在那个窗口按 `Ctrl+C`。
2. 将整个便携文件夹复制到新电脑，或重新解压 ZIP。
3. 新电脑打开代理软件与校园 VPN（如需），让工作台重新检测。
4. 连接同一台 Linux 服务器，再打开项目或恢复训练会话。

服务器信息跟随文件夹中的 `server.json`。本机代理和 VS Code 路径保存在当前电脑的 `%LOCALAPPDATA%\RLWorkbench`，不需要把这些运行状态一起搬走。

同一个 `17890` 同时只能由一条通道占用。旧电脑突然关机时，可能要等服务器发现连接失效才会释放端口。工具不会强行停止未知连接。

**新电脑仍需能够访问服务器内网地址。外网代理不能替代校园 VPN。**

## 05 / 出问题时，我先检查什么

| 现象 | 排查方向 |
| --- | --- |
| 本机代理不可连接 | 代理软件是否开启，端口是否与当前电脑实际设置一致 |
| SSH 登录失败或超时 | 校园网 / VPN、服务器地址、账号、SSH 端口与认证 |
| 检测到已有通道 | 旧专用窗口是否还在；只需编辑时可用“仅打开 VS Code” |
| remote port forwarding failed | 转发端口被占用，或管理员禁止转发 |
| SSH 连上，但网络检查失败 | 查看 HTTP 结果，再检查本机代理节点和域名规则 |
| 状态正常，但 AI 仍失败 | 查看该扩展的日志、登录状态与实际代理配置 |
| 模型菜单显示 Upgrade | 核对账号套餐；代理不能改变订阅权限 |
| 关电脑后训练停止 | 检查是否放在 tmux / 调度器中，以及是否仍依赖在线服务 |

必要时，在 Linux 查看监听，先确认是谁占用了端口：

```bash
ss -ltnp 'sport = :17890'
```

手工验证服务器代理链路：

```bash
curl --noproxy "" --proxy http://127.0.0.1:17890 --connect-timeout 10 --max-time 30 -sS -o /dev/null -w 'HTTP=%{http_code}\n' https://api.githubcopilot.com/_ping
```

工作台不可用时，可以在 Windows 使用备用命令。这里的 `7890`、账号和地址都要按实际环境替换：

```powershell
ssh -N -T -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 127.0.0.1:17890:127.0.0.1:7890 your-user@192.0.2.1
```

`ExitOnForwardFailure` 只说明转发监听能够建立，外网是否可用还要单独测试。[OpenSSH 说明](https://man.openbsd.com/ssh_config.5)

## 06 / 留给以后查阅的配置

### VS Code 的远程代理

本次记录中的远程设置文件位于 `/home/your-user/.vscode-server/data/Machine/settings.json`：

```json
{
  "http.useLocalProxyConfiguration": false,
  "http.proxy": "http://127.0.0.1:17890"
}
```

有其他设置时只合并这两项，随后执行 `Developer: Reload Window`。配置放在个人远程设置中，不写入科研仓库的 `.vscode/settings.json`。[VS Code 远程排查](https://code.visualstudio.com/docs/remote/troubleshooting)

### Linux 终端中的代理

```bash
export http_proxy=http://127.0.0.1:17890
export https_proxy=$http_proxy
export HTTP_PROXY=$http_proxy
export HTTPS_PROXY=$http_proxy
export no_proxy=localhost,127.0.0.1,::1
export NO_PROXY=$no_proxy
```

这些变量影响当前 shell 及之后启动的子进程，不会自动改变已经运行的扩展、容器和服务。需要时再合并到自己的 `~/.bashrc`；工作台没有代替我修改它。内部服务需要直连时，追加到绕过列表。

### 训练会话与结果查看

在服务器上进入项目，并新建训练会话：

```bash
cd /home/your-user/tron1-rl-isaaclab
tmux new -s train
# 在 tmux 内按项目 README 激活环境，再执行已验证的训练命令
```

暂时离开时，先按 `Ctrl+B`，松开后按 `D`。下次连接后恢复：

```bash
tmux attach -t train
```

正式长跑前，先确认 GPU 和 Python 环境，再用少量环境、少量迭代做短跑，核对日志写入和 checkpoint 加载。保存启动命令、配置、随机种子、代码版本与模型。原始搭建记录尚未核实训练入口和恢复参数，因此这里保留项目 README 作为执行依据。

`tmux` 不能抵抗服务器重启或程序崩溃；集群要求调度器时，仍应通过调度器申请和运行 GPU 任务。[tmux 手册](https://man.openbsd.org/tmux.1)

有 TensorBoard 日志并安装相应工具时，在 Linux 训练环境运行：

```bash
python -m tensorboard.main --logdir /实际日志目录 --host 127.0.0.1 --port 6006
```

随后在 VS Code 的“端口”面板转发 `6006`。模型和日志留在 Linux，需要时用 VS Code 下载或通过 `scp` 复制。备份实验时，同时保留配置、代码版本和环境记录。

### AI 面板的核对

2026-10-17 的搭建记录中，Copilot 在 VS Code 的“聊天”面板中完成了远程文件读取验收。Codex 使用独立的扩展入口和账号登录，不与 Copilot 共用订阅权限。

网络正常后，可以让 AI 做一次只读检查：

> 只读取当前远程工作区的 rsl_rl/setup.py，报告绝对路径、包名和版本，不修改文件、不安装依赖、不启动训练。

当时核对结果为 `rsl_rl`、`2.0.2`。后续应以实际源码为准。账号可用模型与套餐规则可能变化，查看相应服务的说明：[GitHub 当时的模型选择规则](https://github.blog/changelog/2026-06-24-changes-to-model-selection-for-free-and-student-plans/) · [Codex 登录说明](https://learn.chatgpt.com/docs/auth)。

## 07 / 已验证什么，还没验证什么

**2026-10-17 的原始记录：** Windows 本机代理与 Linux 转发入口均访问 GitHub / Copilot 返回 HTTP 200；Copilot 成功读取远程 `rsl_rl/setup.py`，文件没有改动。详细检查过程保存在压缩包内的 `验证记录.txt`。

**2026-10-18 的界面补充：** 使用示例服务器配置运行工作台，本机代理识别和外网检测通过；完成主界面与高级设置截图。这次只检查本机界面，没有连接示例服务器，也没有启动训练。

尚未完整验证的部分仍然保留：第二台 Windows 的实际接管、Codex 独立登录与请求，以及真实训练启动。界面正常、代理联网和训练可用，分别需要各自的证据。

## 08 / 保存位置与回滚

| 内容 | 保存位置或处理方式 |
| --- | --- |
| 服务器信息 | 便携文件夹内的 `server.json` |
| 本机配置与连接状态 | `%LOCALAPPDATA%\RLWorkbench` |
| VS Code 使用的 SSH 别名 | `%USERPROFILE%\.ssh\config` 中带 `RL-WORKBENCH` 标记的段落 |
| 原 SSH 配置备份 | 旁边的 `config.rl-workbench.时间戳.bak` |

工作台通过专用 SSH 连接建立回环转发，并在服务器内存中运行只读健康检查，需要 Linux 的 `python3` 和 `curl`。它不修改训练代码、服务器启动文件或防火墙；没有自动重连或开机自启。休眠、断网后需要重新连接。

关闭面板不关闭通道；“断开”只操作经过身份核对的本工具进程，不会停止训练或其他连接。程序使用进程范围的 PowerShell 执行设置，不修改机器或用户的永久策略。

原始备份和启动脚本保存在个人目录下的 `Documents\Copilot-SSH-Proxy\`。本次记录对应的回滚命令如下；其中时间戳目录属于当时的备份，其他环境需要使用自己的实际备份路径：

```bash
python3 ~/.local/state/copilot-ssh-proxy/20261017T134911/rollback.py ~/.local/state/copilot-ssh-proxy/20261017T134911/manifest.json
```

回滚脚本保留其他新增配置；如果文件后来被修改或含有 JSONC 注释，应按差异处理。回滚后重载 VS Code，再断开代理。

不再使用工具时，先断开并关闭工作台，再移除快捷方式和工具文件夹。清理 SSH 别名时，只移除对应标记段，不用旧备份覆盖后来新增的配置。模型、科研文件和原有 SSH 配置应各自保留。
