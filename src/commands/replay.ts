import {Command, Flags} from '@oclif/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {success, failure} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'

/** 事件记录 */
interface EventRecord {
  timestamp: string
  type: string
  data: Record<string, unknown>
}

/** 事件日志路径 */
function getEventsPath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'events', 'events.jsonl')
}

/** 确定性回放事件序列 */
export default class Replay extends Command {
  static override description = '确定性回放事件序列'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
    limit: Flags.integer({
      description: '回放最近 N 条事件',
      default: 50,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Replay)
    const workspacePath = path.resolve(flags['workspace-path'])

    // 检查工作区是否已初始化
    const aiDevPath = path.join(workspacePath, '.ai-dev')
    if (!fs.existsSync(aiDevPath)) {
      const error = {
        code: ErrorCodes.CFG_FILE_NOT_FOUND,
        message: '工作区未初始化，请先运行 ai-dev init',
        recovery: '请先运行 ai-dev init 初始化工作区',
      }
      outputResult(this, failure(error), flags)
      return
    }

    try {
      const eventsPath = getEventsPath(workspacePath)

      if (!fs.existsSync(eventsPath)) {
        outputResult(
          this,
          success({
            message: '事件日志为空',
            events: [],
            total: 0,
          }),
          flags,
        )
        return
      }

      // 读取事件日志
      const content = fs.readFileSync(eventsPath, 'utf-8')
      const lines = content.trim().split('\n').filter(Boolean)

      // 解析事件
      const events: EventRecord[] = []
      for (const line of lines) {
        try {
          events.push(JSON.parse(line))
        } catch {
          // 跳过无效行
        }
      }

      // 获取最近的 N 条事件
      const limit = flags.limit || 50
      const recentEvents = events.slice(-limit)

      // 按时间排序
      recentEvents.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })

      outputResult(
        this,
        success({
          message: `回放最近 ${recentEvents.length} 条事件`,
          events: recentEvents,
          total: events.length,
          replayed: recentEvents.length,
        }),
        flags,
      )
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `回放失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
