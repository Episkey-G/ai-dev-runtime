import {Command, Flags} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import {failure, success} from '../../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../../cli/error-codes.js'
import {outputResult} from '../../cli/output.js'
import {loadWorkspaceConfig} from '../../core/workspace-store.js'

type ConfigSource = 'env' | 'file' | 'flag'

interface ResolvedDefaults {
  deepAnalyzer: string
  executor: string
  gatePolicy: string[]
}

/** 配置文件路径 */
function getConfigPath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'config.json')
}

/** Show 命令：查看当前配置 */
export default class ConfigShow extends Command {
  static override description = '查看当前工作区配置'
  static override flags = {
    'deep-analyzer': Flags.string({description: '临时覆盖 deepAnalyzer（最高优先级）'}),
    executor: Flags.string({description: '临时覆盖 executor（最高优先级）'}),
    'gate-policy': Flags.string({description: '临时覆盖 gatePolicy，使用逗号分隔'}),
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigShow)
    const workspacePath = path.resolve(flags['workspace-path'])
    const configPath = getConfigPath(workspacePath)

    if (!fs.existsSync(configPath)) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_FILE_NOT_FOUND,
          message: '配置文件不存在，请先运行 ai-dev init',
          recovery: RecoveryActions.CFG_FILE_NOT_FOUND,
        }),
        flags,
      )
      return
    }

    try {
      const config = loadWorkspaceConfig(workspacePath)
      const defaults = resolveDefaults(config, flags)
      const resolvedConfig = {
        ...config,
        _meta: {
          'config_path': configPath,
          priority: 'CLI flags > ENV vars > .ai-dev/config.json',
          'resolved_sources': defaults.sources,
        },
        defaults: {
          deepAnalyzer: defaults.values.deepAnalyzer,
          executor: defaults.values.executor,
          gatePolicy: defaults.values.gatePolicy,
        },
      }

      outputResult(this, success(resolvedConfig), flags)
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `加载配置失败: ${(error_ as Error).message}`,
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }),
        flags,
      )
    }
  }
}

function resolveDefaults(
  config: Record<string, unknown>,
  flags: {
    'deep-analyzer'?: string
    executor?: string
    'gate-policy'?: string
  },
): {sources: Record<string, ConfigSource>; values: ResolvedDefaults} {
  const defaults = (config.defaults ?? {}) as Record<string, unknown>
  const fileExecutor = readString(defaults.executor, 'claude')
  const fileDeepAnalyzer = readString(defaults.deepAnalyzer, 'codex')
  const fileGatePolicy = readStringList(defaults.gatePolicy, [
    'prd_freeze',
    'architecture_freeze',
    'high_complexity',
    'release',
    'fix_loop',
  ])

  const envExecutor = process.env.AIDEV_EXECUTOR
  const envDeepAnalyzer = process.env.AIDEV_DEEP_ANALYZER
  const envGatePolicy = process.env.AIDEV_GATE_POLICY

  const resolvedExecutor = pickValue(flags.executor, envExecutor, fileExecutor)
  const resolvedDeepAnalyzer = pickValue(flags['deep-analyzer'], envDeepAnalyzer, fileDeepAnalyzer)
  const resolvedGatePolicy = pickValueList(flags['gate-policy'], envGatePolicy, fileGatePolicy)

  return {
    sources: {
      'defaults.deepAnalyzer': resolvedDeepAnalyzer.source,
      'defaults.executor': resolvedExecutor.source,
      'defaults.gatePolicy': resolvedGatePolicy.source,
    },
    values: {
      deepAnalyzer: resolvedDeepAnalyzer.value,
      executor: resolvedExecutor.value,
      gatePolicy: resolvedGatePolicy.value,
    },
  }
}

function normalizeList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function pickValue(
  flagValue: string | undefined,
  envValue: string | undefined,
  fileValue: string,
): {source: ConfigSource; value: string} {
  if (flagValue && flagValue.trim().length > 0) {
    return {source: 'flag', value: flagValue.trim()}
  }

  if (envValue && envValue.trim().length > 0) {
    return {source: 'env', value: envValue.trim()}
  }

  return {source: 'file', value: fileValue}
}

function pickValueList(
  flagValue: string | undefined,
  envValue: string | undefined,
  fileValue: string[],
): {source: ConfigSource; value: string[]} {
  if (flagValue && flagValue.trim().length > 0) {
    return {source: 'flag', value: normalizeList(flagValue)}
  }

  if (envValue && envValue.trim().length > 0) {
    return {source: 'env', value: normalizeList(envValue)}
  }

  return {source: 'file', value: fileValue}
}

function readString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  return fallback
}

function readStringList(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const list = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    if (list.length > 0) {
      return list.map((item) => item.trim())
    }
  }

  return fallback
}
