/**
 * 标准错误码族定义
 * 所有错误码遵循 {PREFIX}_{NAME} 格式，映射到对应错误语义。
 */

/** CFG_* 族：配置与前置检查相关 */
export const ErrorCodes = {
  /** 关键依赖缺失 */
  CFG_DEPENDENCY_MISSING: 'CFG_DEPENDENCY_MISSING',
  /** 配置文件不存在或不可读 */
  CFG_FILE_NOT_FOUND: 'CFG_FILE_NOT_FOUND',
  /** Node.js 版本不满足最低要求 */
  CFG_NODE_VERSION: 'CFG_NODE_VERSION',
  /** npm 不可用或版本异常 */
  CFG_NPM_UNAVAILABLE: 'CFG_NPM_UNAVAILABLE',
  /** 配置校验失败 */
  CFG_VALIDATION_FAILED: 'CFG_VALIDATION_FAILED',
  /** 工作区目录无写权限 */
  CFG_WORKSPACE_PERMISSION: 'CFG_WORKSPACE_PERMISSION',
  /** 工作区已存在（幂等场景） */
  CFG_WORKSPACE_EXISTS: 'CFG_WORKSPACE_EXISTS',
  /** 工作区路径无效 */
  CFG_WORKSPACE_PATH_INVALID: 'CFG_WORKSPACE_PATH_INVALID',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/** 错误码到可恢复动作的映射 */
export const RecoveryActions: Record<ErrorCode, string> = {
  [ErrorCodes.CFG_DEPENDENCY_MISSING]: '请运行 npm install 重新安装依赖',
  [ErrorCodes.CFG_FILE_NOT_FOUND]: '请检查配置文件路径是否正确',
  [ErrorCodes.CFG_NODE_VERSION]: '请升级 Node.js 至 24 LTS 或更高版本: https://nodejs.org/',
  [ErrorCodes.CFG_NPM_UNAVAILABLE]: '请确认 npm 已安装且可用: npm --version',
  [ErrorCodes.CFG_VALIDATION_FAILED]: '请检查配置文件内容是否符合 schema 要求',
  [ErrorCodes.CFG_WORKSPACE_PERMISSION]: '请检查目标目录权限或切换到有写权限的目录',
  [ErrorCodes.CFG_WORKSPACE_EXISTS]: '工作区已存在，如需重新初始化请先删除 .ai-dev 目录或使用 --force 覆盖',
  [ErrorCodes.CFG_WORKSPACE_PATH_INVALID]: '请检查路径是否合法（不能包含特殊字符）',
}
