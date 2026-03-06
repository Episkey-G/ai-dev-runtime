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

/** Set 命令：更新配置 */
export default class ConfigSet extends Command {
  static override description = '更新工作区配置'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
    key: Flags.string({
      description: '配置键（如 defaults.executor）',
      required: true,
    }),
    value: Flags.string({
      description: '配置值',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigSet)
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

      // 解析键路径（如 "defaults.executor"）
      const keys = flags.key.split('.')
      let current: Record<string, unknown> = config as Record<string, unknown>

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key] as Record<string, unknown>
      }

      // 设置值
      const lastKey = keys[keys.length - 1]
      const oldValue = current[lastKey]
      current[lastKey] = flags.value

      // 保存
      saveConfig(configPath, config)

      outputResult(
        this,
        success({
          message: '配置更新成功',
          key: flags.key,
          oldValue,
          newValue: flags.value,
          source: 'config-file',
        }),
        flags,
      )
    } catch (err) {
      const errorCode = (err as Error).message || ErrorCodes.CFG_VALIDATION_FAILED
      const error = {
        code: errorCode as (typeof ErrorCodes)[keyof typeof ErrorCodes],
        message: `更新配置失败: ${(err as Error).message}`,
        recovery:
          RecoveryActions[errorCode as keyof typeof RecoveryActions] ||
          RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}

/** 保存配置 */
function saveConfig(configPath: string, config: Record<string, unknown>): void {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}
