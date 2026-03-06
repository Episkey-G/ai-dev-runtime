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

/** 保存配置 */
function saveConfig(workspacePath: string, config: Record<string, unknown>): void {
  const configPath = getConfigPath(workspacePath)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

/** Show 命令：查看当前配置 */
export default class ConfigShow extends Command {
  static override description = '查看当前工作区配置'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigShow)
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
      // 显示配置来源信息
      const configWithMeta = {
        ...config,
        _meta: {
          source: 'config-file',
          path: configPath,
          priority: 'ENV > CLI flags > config.yaml (未实现)',
        },
      }
      outputResult(this, success(configWithMeta), flags)
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `加载配置失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
