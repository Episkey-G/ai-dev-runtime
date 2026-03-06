import {Command, Flags} from '@oclif/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {success, failure} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'

/** 验证工作区健康状态 */
function validateWorkspace(workspacePath: string): {valid: boolean; errors: string[]} {
  const errors: string[] = []

  // 检查 .ai-dev 目录
  const aiDevPath = path.join(workspacePath, '.ai-dev')
  if (!fs.existsSync(aiDevPath)) {
    errors.push('.ai-dev 目录不存在')
    return {valid: false, errors}
  }

  // 检查必需文件
  const requiredFiles = [
    'config.json',
    'snapshots/state.json',
    'events/events.jsonl',
  ]

  for (const file of requiredFiles) {
    const filePath = path.join(aiDevPath, file)
    if (!fs.existsSync(filePath)) {
      errors.push(`缺少必需文件: ${file}`)
    }
  }

  // 验证 state.json 格式
  const statePath = path.join(aiDevPath, 'snapshots', 'state.json')
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
      if (!state.sessionId) {
        errors.push('状态文件缺少 sessionId')
      }
      if (!state.stage) {
        errors.push('状态文件缺少 stage')
      }
    } catch {
      errors.push('状态文件格式无效')
    }
  }

  return {valid: errors.length === 0, errors}
}

/** 状态文件路径 */
function getStatePath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'snapshots', 'state.json')
}

/** 事件日志路径 */
function getEventsPath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'events', 'events.jsonl')
}

/** 从中断点恢复编排 */
export default class Resume extends Command {
  static override description = '从中断点恢复编排（含 preflight 校验）'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Resume)
    const workspacePath = path.resolve(flags['workspace-path'])

    // 执行 preflight 验证
    const validation = validateWorkspace(workspacePath)

    if (!validation.valid) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: 'Preflight 验证失败',
        details: {errors: validation.errors},
        recovery: '请检查工作区完整性，确保所有必需文件存在',
      }
      outputResult(this, failure(error), flags)
      return
    }

    try {
      // 加载状态
      const statePath = getStatePath(workspacePath)
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'))

      // 加载最近事件
      const eventsPath = getEventsPath(workspacePath)
      let recentEvents: string[] = []
      if (fs.existsSync(eventsPath)) {
        const eventsContent = fs.readFileSync(eventsPath, 'utf-8')
        const lines = eventsContent.trim().split('\n').filter(Boolean)
        recentEvents = lines.slice(-10) // 最近10条
      }

      outputResult(
        this,
        success({
          message: '恢复成功',
          preflight: 'passed',
          sessionId: state.sessionId,
          stage: state.stage,
          lastTransition: state.lastTransition,
          recentEvents,
          nextStep: '执行 ai-dev next 继续工作流',
        }),
        flags,
      )
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `恢复失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
