/**
 * 运行前置检查
 * 检查 Node 版本、npm 可用性、关键依赖存在性。
 */

import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import type {ErrorDetail} from './envelope.js'

import {ErrorCodes, RecoveryActions} from './error-codes.js'

const MIN_NODE_MAJOR = 24

/** 关键依赖列表（必须在 node_modules 中存在） */
const CRITICAL_DEPENDENCIES = ['@oclif/core'] as const

/** CLI 包根目录（基于当前文件位置向上两级：src/cli/ → 项目根） */
const CLI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** 检查 Node.js 版本 */
export function checkNodeVersion(): ErrorDetail | null {
  const version = process.versions.node
  const major = Number.parseInt(version.split('.')[0], 10)
  if (major < MIN_NODE_MAJOR) {
    return {
      code: ErrorCodes.CFG_NODE_VERSION,
      details: {current: version, required: `>= ${MIN_NODE_MAJOR}`},
      message: `Node.js 版本 ${version} 不满足最低要求 (>= ${MIN_NODE_MAJOR})`,
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

/** 检查关键依赖存在性（基于 CLI 安装目录，非 process.cwd()） */
export function checkCriticalDependencies(): ErrorDetail | null {
  const missing: string[] = []

  for (const dep of CRITICAL_DEPENDENCIES) {
    const depPath = resolve(CLI_ROOT, 'node_modules', dep)
    if (!existsSync(depPath)) {
      missing.push(dep)
    }
  }

  if (missing.length > 0) {
    return {
      code: ErrorCodes.CFG_DEPENDENCY_MISSING,
      details: {missing},
      message: `关键依赖缺失: ${missing.join(', ')}`,
      recovery: RecoveryActions[ErrorCodes.CFG_DEPENDENCY_MISSING],
    }
  }

  return null
}

/** 执行所有前置检查，返回第一个失败项 */
export function runPreflightChecks(): ErrorDetail | null {
  return checkNodeVersion() ?? checkNpmAvailability() ?? checkCriticalDependencies()
}
