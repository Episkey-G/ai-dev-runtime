import {Command, Flags} from '@oclif/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {success, failure} from '../../cli/envelope.js'
import {outputResult} from '../../cli/output.js'
import {ErrorCodes, RecoveryActions} from '../../cli/error-codes.js'

/** 配置文件路径 */
function getConfigPath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'config.json')
}

/** 加载配置 */
function loadConfig(workspacePath: string): Record<string, unknown> {
  const configPath = getConfigPath(workspacePath)
  if (!fs.existsSync(configPath)) {
    throw new Error('CFG_FILE_NOT_FOUND')
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

/** 校验配置 */
function validateConfig(config: Record<string, unknown>): {valid: boolean; errors: string[]} {
  const errors: string[] = []

  // 必需字段检查
  if (!config.version) {
    errors.push('缺少必填字段: version')
  }

  if (!config.defaults) {
    errors.push('缺少必填字段: defaults')
  } else {
    const defaults = config.defaults as Record<string, unknown>
    if (!defaults.executor) {
      errors.push('defaults.executor 为必填项')
    }
    if (!defaults.deepAnalyzer) {
      errors.push('defaults.deepAnalyzer 为必填项')
    }
  }

  // 值校验
  const defaults = config.defaults as Record<string, unknown>
  if (defaults?.executor && !['claude', 'codex'].includes(defaults.executor as string)) {
    errors.push('defaults.executor 必须是 claude 或 codex')
  }

  if (defaults?.deepAnalyzer && !['claude', 'codex'].includes(defaults.deepAnalyzer as string)) {
    errors.push('defaults.deepAnalyzer 必须是 claude 或 codex')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/** Validate 命令：校验配置 */
export default class ConfigValidate extends Command {
  static override description = '校验工作区配置'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigValidate)
    const workspacePath = path.resolve(flags['workspace-path'])
    const configPath = getConfigPath(workspacePath)

    if (!fs.existsSync(configPath)) {
      const error = {
        code: ErrorCodes.CFG_FILE_NOT_FOUND,
        message: '配置文件不存在，请先运行 ai-dev init',
        recovery: RecoveryActions.CFG_FILE_NOT_FOUND,
      }
      outputResult(this, failure(error), flags)
      return
    }

    try {
      const config = loadConfig(workspacePath)
      const result = validateConfig(config)

      if (result.valid) {
        outputResult(
          this,
          success({
            valid: true,
            message: '配置校验通过',
            config,
          }),
          flags,
        )
      } else {
        const error = {
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `配置校验失败: ${result.errors.join('; ')}`,
          details: {errors: result.errors},
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }
        outputResult(this, failure(error), flags)
      }
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `校验失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
