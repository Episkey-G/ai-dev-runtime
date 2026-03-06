# AI Dev Runtime - Quick Start Guide

## 安装

```bash
# 克隆项目
git clone https://github.com/Episkey-G/ai-dev-runtime.git
cd ai-dev-runtime

# 安装依赖
npm install

# 构建
npm run build
```

## 快速开始

### 1. 初始化工作区

```bash
ai-dev init
```

这会创建 `.ai-dev/` 目录，包含：
- `config.json` - 工作区配置
- `events/events.jsonl` - 事件日志
- `snapshots/state.json` - 状态快照

### 2. 开始编排

```bash
ai-dev next
```

系统会：
- 创建新的 session
- 推进到 RESEARCH 阶段
- 返回当前阶段和推荐动作

### 3. 查看配置

```bash
# 查看当前配置
ai-dev config show

# 更新配置
ai-dev config set --key defaults.executor --value codex

# 校验配置
ai-dev config validate
```

## 工作流阶段

```
IDLE → RESEARCH → PLAN → IMPLEMENT → REVIEW → EXECUTE → IDLE
```

- **IDLE**: 初始状态
- **RESEARCH**: 收集需求与分析
- **PLAN**: 制定实现计划
- **IMPLEMENT**: 执行开发任务
- **REVIEW**: 代码审查
- **EXECUTE**: 执行完成

## 可用命令

| 命令 | 说明 |
|------|------|
| `ai-dev init` | 初始化工作区 |
| `ai-dev next` | 推进到下一阶段 |
| `ai-dev config show` | 查看配置 |
| `ai-dev config set` | 更新配置 |
| `ai-dev config validate` | 校验配置 |
| `ai-dev approve` | 批准当前决策 |
| `ai-dev reject` | 拒绝当前决策 |
| `ai-dev handoff` | 切换 Agent |
| `ai-dev resume` | 恢复工作区 |
| `ai-dev replay` | 回放事件 |

## 配置

默认配置位于 `.ai-dev/config.json`：

```json
{
  "version": "0.1.0",
  "workspaceVersion": "1.0.0",
  "defaults": {
    "executor": "claude",
    "deepAnalyzer": "codex",
    "gatePolicy": ["prd_freeze", "architecture_freeze", "high_complexity"]
  }
}
```

## 故障排除

### Node.js 版本要求

需要 Node.js 24 LTS 或更高版本：

```bash
node --version
```

### 权限错误

如果遇到权限错误，检查目标目录的写权限。

### 查看日志

事件日志位于 `.ai-dev/events/events.jsonl`

状态快照位于 `.ai-dev/snapshots/state.json`
