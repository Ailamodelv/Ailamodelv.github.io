---
title: 强化学习远程工作流：工作台使用指南
date: 2026-10-17
category: debug 经历
tags: 强化学习, 远程开发, Windows, Linux, SSH
summary: 记录 Windows 与 Linux 之间的强化学习远程开发工作流、便携工作台用法、代理连接和排错过程。
---

> 公开版说明：服务器地址、登录用户名和个人目录已替换为示例。192.0.2.1 仅用于文档示例，使用工具前请填写自己的服务器信息。下方验收记录来自原始笔记，不表示公开包已在你的环境中验证。

[下载强化学习工作台便携版（ZIP）](/assets/downloads/rl-workbench-portable-2026-10-17.zip)。包内包含程序、源码、使用指南和验证记录。解压整个文件夹后使用。

**Windows 负责编辑和提供外网代理；Linux 保存代码、环境和训练任务。换电脑，只换网络出口，不搬训练环境。**

更新：2026-10-17。日常看第 1–3 节；配置和故障时再看后面。

## 1. 双击使用：只记住“检测 → 连接”

本机双击桌面 **强化学习工作台**；换电脑时解压整个便携包，双击 `RLWorkbench.exe`。不需要填写本机 IP，也不用手抄 SSH 命令。

主界面最上方只保留三个固定信息。公开下载包使用以下示例值，首次使用请改为自己的服务器信息：

| 字段 | 示例值 |
| --- | --- |
| 服务器地址 | `192.0.2.1` |
| 用户名 | `your-user` |
| 服务器代理入口 | `17890` |

修改后点击 **保存服务器信息**，配置会随工具文件夹带走。服务器代理入口一般不改；如果改了，还需同步修改 Linux 的代理配置。

日常使用：

1. 打开当前电脑的代理软件；校外先连接学校 VPN。
2. 打开工作台，它会自动检测，也可点击 **一键检测本机**。
3. 工具自动识别本机代理端口、VS Code 位置和 SSH 客户端，并测试代理外网连接。
4. 点击 **连接服务器**，在弹出的 SSH 窗口本地输入密码。首次连接按管理员提供的信息核对主机指纹。
5. 完成检测后自动打开 VS Code 的远程窗口。在 VS Code 中选择“打开文件夹”，再选择服务器上的项目；本项目为 `/home/your-user/tron1-rl-isaaclab`。

**不再要求填 Linux 项目目录。** 建立 SSH 和代理通道不需要它，它只决定编辑哪个项目，交给 VS Code 选择更直观。

**SSH 端口是什么？** 它是服务器接受远程登录的入口，通常为 **22**，与代理用的 **17890** 不同。当前已默认使用 22，放在“高级设置”中；只有管理员明确改过端口才需要修改。

按钮说明：

| 按钮 | 用途 |
| --- | --- |
| 一键检测本机 | 自动寻找本机代理并测试联网，识别 VS Code / SSH；程序打开时也会自动检测 |
| 连接服务器 | 建立代理通道，登录后打开 VS Code 远程窗口 |
| 仅打开 VS Code | 只打开远程窗口，不新建代理通道；适合已有通道或只需查看训练 |
| 重新检查网络 | 从服务器重新测试代理链路 |
| 断开 | 只断开本工具的代理连接，不停止训练 |
| 高级设置 | 修改非默认 SSH 端口、手动代理端口，或定位未识别的便携版 VS Code |

“已识别代理”和“外网检测通过”是两件事。若找到系统已配置的代理，但外网暂时超时，会明确提示；可重试，或连接后复测。没有可信代理设置、仅有某个开放端口时，不会直接将其当成可用代理。

SSH 密码仍由系统 OpenSSH 在本地窗口询问，工具不保存。VS Code 可能另问一次密码。SSH 窗口需保留，可最小化；关闭工作台面板不会断开通道。

## 2. 换电脑：复制整个文件夹即可带走服务器信息

1. 在旧电脑点击 **断开**；如果用的是旧版专用 SSH 窗口，到该窗口按 Ctrl+C。
2. 将整个“强化学习工作台”文件夹复制过去，或者解压便携版 ZIP。不要只复制 EXE。
3. 新电脑开启代理和校园 VPN（如需），双击工作台，它会重新检测新电脑的代理端口。
4. 点击连接，输入服务器密码。

```text
今天：Linux 127.0.0.1:17890 → SSH → A 电脑的代理 → 外网
明天：Linux 127.0.0.1:17890 → SSH → B 电脑的代理 → 外网
```

**A 关机后，B 可以独立接手。** B 自己必须能访问学校服务器内网地址；外网代理不能代替校园 VPN。

服务器信息保存在便携文件夹的 `server.json`；本机代理和 VS Code 路径保存在当前电脑的 `%LOCALAPPDATA%\RLWorkbench`。换电脑重新检测，不把旧电脑端口当成固定值。

新电脑需要 Windows 10/11、系统 Windows PowerShell 5.1 / .NET Framework 4.8、OpenSSH 客户端、VS Code + Remote-SSH，以及可用代理软件。工具会提示所检测到的缺失项，不自动安装系统组件。代理软件只提供 PAC 或 SOCKS、需要代理账号，或未开启时，未必能自动识别 HTTP 入口，可按软件说明开启 HTTP / 混合代理。

同一个 17890 同时只能由一条通道占用。原电脑突然关机后，旧监听可能需要等服务器发现失联才释放；工具不会强行踢掉其他连接。出现占用提示时见第 7 节。

## 3. 训练与 AI 使用

### AI：选择对的面板

- **Copilot**：VS Code 右侧“聊天”。本次验证过“本地”框架 + Agent + Auto 能读远程文件。“本地”不代表文件位于 Windows。
- **ChatGPT Pro / Codex**：点击右侧“聊天”旁的 **Codex** 标签，选择 **Sign in with ChatGPT**，登录自己的 Pro 账号。安装的是 OpenAI 发布的 `OpenAI.chatgpt` 扩展。
- Copilot 学生计划当前只提供 Auto；Upgrade 提示是套餐限制，不能靠改代理解锁。ChatGPT Pro 不会解锁 Copilot 菜单；API Key 是另外计费的入口。[GitHub 规则](https://github.blog/changelog/2026-06-24-changes-to-model-selection-for-free-and-student-plans/) · [Codex 登录](https://learn.chatgpt.com/docs/auth)

网络通了之后，让 AI 做一次真实只读验收：

> 只读取当前远程工作区的 rsl_rl/setup.py，报告绝对路径、包名和版本，不修改文件、不安装依赖、不启动训练。

本次实际核对结果为 `rsl_rl`、`2.0.2`。若文件后来改过，以实际源码为准。

### 训练：放在服务器的 tmux 中

在 Linux 终端运行：

```bash
cd /home/your-user/tron1-rl-isaaclab
tmux new -s train
# 在 tmux 内按项目 README 激活环境，再执行已验证的训练命令
```

离开但继续训练：先按 `Ctrl+B`，松开后按 `D`。换电脑连接后：

```bash
tmux attach -t train
```

正式训练前：确认 GPU / Python 环境，先做少量环境、少量迭代的短跑；确认日志写入、checkpoint 能重新加载，再开始长跑。每次保存启动命令、配置、随机种子、Git 版本和 checkpoint。当前项目的训练入口、环境名和恢复参数尚未核实，因此不提供猜测的训练命令。

提前下载依赖和仿真资产，日志写 Linux 本地；这样 Windows 断开影响 AI 和外网访问，不应影响不依赖外网的训练。tmux 不能抵抗服务器重启或程序崩溃；集群要求调度器时，用调度器申请和运行 GPU 任务。[tmux 手册](https://man.openbsd.org/tmux.1)

## 4. 哪些流量会走当前电脑

SSH 通道提供的是 **HTTP 代理入口，不是全流量 VPN**。配置为使用它的请求会走当前电脑，国内 / 国外分流由当前电脑的代理规则决定。

| 程序 | 如何使用 |
| --- | --- |
| Copilot 远程扩展 | 使用下面的 VS Code 远程代理设置；本次已验收 |
| Codex | 需单独验证登录、实际进程代理和文件读取；安装成功不等于联网成功 |
| pip、curl、HTTPS Git 等 | 使用终端代理环境变量，具体以工具支持为准 |
| SSH Git、UDP、容器、系统服务等 | 不能假定自动使用 HTTP 代理，需要单独配置 |

**要让服务器任何程序、任何协议都自动走电脑，需要另外部署 VPN/TUN 与路由，通常涉及管理员权限；这个工作台没有实现。**

### VS Code 远程配置：已存在，不随电脑切换

文件：`/home/your-user/.vscode-server/data/Machine/settings.json`。

```json
{
  "http.useLocalProxyConfiguration": false,
  "http.proxy": "http://127.0.0.1:17890"
}
```

有其他设置时只合并两项，不覆盖整个文件。修改后执行 `Developer: Reload Window`。不要写到科研仓库的 `.vscode/settings.json`。[VS Code 远程排查](https://code.visualstudio.com/docs/remote/troubleshooting)

### Linux 终端代理：需要时执行

```bash
export http_proxy=http://127.0.0.1:17890
export https_proxy=$http_proxy
export HTTP_PROXY=$http_proxy
export HTTPS_PROXY=$http_proxy
export no_proxy=localhost,127.0.0.1,::1
export NO_PROXY=$no_proxy
```

这些变量只影响当前 shell 和之后启动的子进程，不改变已经运行的扩展、容器或服务。希望新的交互式 Bash 终端自动使用时，可合并到自己的 `~/.bashrc`；本工具没有替你修改它。内部服务需要直连时，追加其主机到绕过列表。通道关闭后，仍使用代理的联网操作会失败。

## 5. 看曲线、取回结果

有 TensorBoard 日志并安装对应工具时，在 Linux 训练环境运行（替换实际日志目录）：

```bash
python -m tensorboard.main --logdir /实际日志目录 --host 127.0.0.1 --port 6006
```

在 VS Code 的 **端口** 面板添加 6006，点击打开浏览器。只转发页面，不需要向校园网公开 TensorBoard 端口。

模型和日志保留在 Linux，需要备份时通过 VS Code 下载，或用 scp 复制指定文件。恢复实验时同时保存模型、配置、代码版本和环境记录，不只保存一个 `.pt`。

## 6. 工具做了什么，保存在哪里

- GUI 是本地 Windows 工具，源码随包提供。SSH 密码交给系统 OpenSSH 输入，不存入配置、日志或 ZIP。
- 服务器信息：工具文件夹的 `server.json`，复制文件夹会带走。本机设置与连接状态：`%LOCALAPPDATA%\RLWorkbench`，换电脑不复制这些运行状态。
- 首次在 VS Code 打开某个目标服务器时，在 `%USERPROFILE%\.ssh\config` 添加带 `RL-WORKBENCH` 标记的专用 Host 别名。原文件存在时，先备份为旁边的 `config.rl-workbench.时间戳.bak`；保留原配置内容。别名负责让 VS Code 正确使用用户名和端口。
- 工具通过专用 SSH 连接建立回环转发，并在服务器内存中运行只读健康检查，需要 Linux 的 `python3` 和 `curl`。不修改训练代码、服务器启动文件或防火墙。
- 断开只操作本工具记录且核对过身份的进程；其他连接不会被停止。
- 无自动重连、无开机自启。休眠 / 断网后重新连接。窗口显示的是最近一次网络检查结果，需要时点重新检查。
- 程序使用当前进程范围的 PowerShell 脚本执行设置，不修改机器或用户的永久执行策略。学校管理策略如禁止运行，应由管理员处理。

## 7. 排错只看这张表

| 现象 | 优先检查 |
| --- | --- |
| 本机代理不可连接 | 当前电脑代理软件是否开着，端口是否真的是 7897 |
| SSH 登录失败 / 超时 | 校园网或 VPN、服务器地址、账号、端口、认证 |
| 检测到已有通道 | 关闭旧专用窗口；或点“仅打开 VS Code”复用现状 |
| remote port forwarding failed | 另一台电脑或旧会话占用 17890，或管理员禁止转发 |
| SSH 连上但网络测试失败 | 看 HTTP 结果；检查当前代理节点及域名规则，点击重新检测 |
| 状态绿色但 AI 失败 | 查看该扩展自己的日志、登录状态和代理使用情况 |
| 模型显示 Upgrade | 账号套餐限制，不是隧道失败 |
| 找不到 Codex | 看“聊天”旁的 Codex 标签，或命令面板执行 Codex: Open Codex Sidebar |
| 关电脑后训练停止 | 是否在 tmux / 调度器内，是否仍依赖在线资产或日志服务 |

必要时在 Linux 看监听，不要终止未知进程：

```bash
ss -ltnp 'sport = :17890'
```

手工验证服务器代理：

```bash
curl --noproxy "" --proxy http://127.0.0.1:17890 --connect-timeout 10 --max-time 30 -sS -o /dev/null -w 'HTTP=%{http_code}\n' https://api.githubcopilot.com/_ping
```

工具不可用时的备用命令，在当前 Windows 执行（替换本机代理端口）：

```powershell
ssh -N -T -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 127.0.0.1:17890:127.0.0.1:7897 your-user@192.0.2.1
```

`ExitOnForwardFailure` 只说明监听能建立，不能代替外网测试。[OpenSSH 说明](https://man.openbsd.com/ssh_config.5)

## 8. 验收记录与回滚

**此前实际验收：** Windows 7897 与 Linux 17890 均访问 GitHub / Copilot 返回 200；Copilot 成功读取远程 `rsl_rl/setup.py`，文件未改动。Codex 后续截图确认已安装且有入口，但其登录与实际请求尚未验收；训练也未在本次对话中启动。

新工作台的检查结果见同文件夹 `验证记录.txt`。不要把界面和模拟测试通过当成换电脑真实联网已验收。

原始备份、记录与启动脚本仍在：

```text
C:\Users\YourName\Documents\Copilot-SSH-Proxy\
```

回滚服务器两项代理设置，在 Linux 执行：

```bash
python3 ~/.local/state/copilot-ssh-proxy/20261017T134911/rollback.py ~/.local/state/copilot-ssh-proxy/20261017T134911/manifest.json
```

脚本保留其他新增配置；若内容后来改变或含 JSONC 注释，停止并要求按差异处理。之后重载 VS Code，再断开代理。

不用新工具时：先断开，关闭工作台，删除其桌面快捷方式和工具文件夹即可；需要清理 SSH 别名时，只移除带 `RL-WORKBENCH` 标记的对应段，不要用旧备份覆盖后来新增的配置。工具不删除 checkpoint、科研文件或原有 SSH 连接配置。
