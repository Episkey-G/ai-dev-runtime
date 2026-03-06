/**
 * 运行前置检查
 * 检查 Node 版本、npm 可用性、关键依赖存在性。
 */

import {execSync} from 'node:child_process'

import {ErrorCodes, RecoveryActions} from './error-codes.js'
import type {ErrorDetail} from './envelope.js'

const MIN_NODE_MAJOR = 24

/** 检查 Node.js 版本 */
export function checkNodeVersion(): ErrorDetail | null {
  const version = process.versions.node
  const major = Number.parseInt(version.split('.')[0], 10)
  if (major < MIN_NODE_MAJOR) {
    return {
      code: ErrorCodes.CFG_NODE_VERSION,
      message: `Node.js 版本 ${version} 不满足最低要求 (>= ${MIN_NODE_MAJOR})`,
      details: {current: version, required: `>= ${MIN_NODE_MAJOR}`},
      recovery: RecoveryActions[ErrorCodes.CFG_NODE_VERSION],
    }
  }

  return null
}

/** 检查 npm 可用性 */
export function checkNpmAvailability(): ErrorDetail | null {
  try {
    execSync('npm --version', {stdio: 'pipe'})
    return null
  } catch {
    return {
      code: ErrorCodes.CFG_NPM_UNAVAILABLE,
      message: 'npm 不可用或未安装',
      recovery: RecoveryActions[ErrorCodes.CFG_NPM_UNAVAILABLE],
    }
  }
}

/** 执行所有前置检查，返回第一个失败项 */
export function runPreflightChecks(): ErrorDetail | null {
  return checkNodeVersion() ?? checkNpmAvailability()
}
