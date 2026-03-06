# GitHub PR 自动审查与自动合并

本文档说明本仓库的 PR 自动化规则与一次性初始化步骤。

## 已配置内容

- `PR Quality Gate`（`.github/workflows/pr-quality-gate.yml`）
  - 触发：`pull_request`、`merge_group`
  - 检查：`npm run lint`、`npm test`、`npm run build`
  - 行为：在 PR 下自动回写审查结果评论（通过/失败/取消）

- `PR Auto Merge`（`.github/workflows/pr-auto-merge.yml`）
  - 触发：`pull_request_target`
  - 条件：
    - PR 处于 `open`
    - 非草稿
    - 目标分支是默认分支
    - PR 标签包含 `automerge`
  - 行为：执行 `gh pr merge --auto --squash --delete-branch`

## 一次性初始化（仓库管理员执行）

```bash
scripts/configure-github-pr-automation.sh <owner/repo>
```

如果不传 `<owner/repo>`，脚本会尝试读取当前仓库。

脚本会执行：
- 启用仓库 `Auto-merge`
- 启用 `Delete branch on merge`
- 设置默认分支保护：
  - 必需检查：`quality`（`PR Quality Gate` 工作流的质量检查 job）
  - 0 审批（不要求人工 Approve）
  - 必须解决对话

## 日常使用

1. 提交 PR，等待 `PR Quality Gate` 通过。
2. 给 PR 打上 `automerge` 标签。
3. 系统自动启用 auto-merge，检查满足后自动 squash 合并并删除分支。

## 常见失败排查

- 报错“自动合并启用失败”
  - 检查仓库是否已开启 `Auto-merge`
  - 检查默认分支保护是否已配置
  - 检查当前 `GITHUB_TOKEN` 是否具备 `contents: write`、`pull-requests: write`

- `PR Quality Gate / quality` 未出现
  - 检查 PR 是否为 Draft（Draft 会跳过质量检查）
  - 检查依赖安装与测试命令是否可在 CI 环境执行
