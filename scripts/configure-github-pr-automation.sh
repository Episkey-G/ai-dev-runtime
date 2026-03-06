#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "错误：未检测到 gh 命令。请先安装 GitHub CLI：https://cli.github.com/" >&2
  exit 1
fi

repo="${1:-}"
if [[ -z "${repo}" ]]; then
  repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)"
fi

if [[ -z "${repo}" ]]; then
  echo "错误：无法识别仓库。请传入 owner/repo，例如：scripts/configure-github-pr-automation.sh episkey/AI-DEV" >&2
  exit 1
fi

default_branch="$(gh repo view "${repo}" --json defaultBranchRef -q '.defaultBranchRef.name' 2>/dev/null || true)"
if [[ -z "${default_branch}" ]]; then
  echo "错误：无法获取仓库默认分支，请确认你对 ${repo} 有访问权限且已登录 gh auth login。" >&2
  exit 1
fi

echo "正在配置仓库：${repo}"
echo "默认分支：${default_branch}"

echo "步骤 1/2：启用仓库级 Auto-merge 与合并后自动删分支"
if ! gh repo edit "${repo}" --enable-auto-merge --delete-branch-on-merge >/dev/null; then
  echo "错误：启用仓库 Auto-merge 失败。请确认你有仓库管理员权限。" >&2
  exit 1
fi

echo "步骤 2/2：设置默认分支保护规则（0 审批 + 必需检查）"
tmp_payload="$(mktemp)"
trap 'rm -f "${tmp_payload}"' EXIT

cat > "${tmp_payload}" <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "PR Quality Gate / quality"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false
}
JSON

if ! gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${repo}/branches/${default_branch}/protection" \
  --input "${tmp_payload}" >/dev/null; then
  echo "错误：分支保护设置失败。请确认默认分支存在且你有管理员权限。" >&2
  exit 1
fi

echo "配置完成："
echo "- 已启用仓库 Auto-merge"
echo "- 已配置默认分支保护（0 审批 + 必需检查 PR Quality Gate / quality）"
echo "- 可在 PR 上打标签 automerge 触发自动合并"
