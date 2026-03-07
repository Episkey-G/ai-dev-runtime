import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {appendAuditEvent} from '../core/event-log.js'
import {acquireWorkspaceLock} from '../core/workspace-lock.js'
import {
  createInitialRuntimeState,
  isWorkspaceInitialized,
  loadRuntimeState,
  resolveWorkspacePaths,
  saveRuntimeState,
} from '../core/workspace-store.js'

/** Next 命令：根据当前阶段生成下一步建议 */
export default class Next extends Command {
  static override description = '基于当前阶段生成下一步建议并推进工作流'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Next)
    const workspacePath = path.resolve(flags['workspace-path'])

    if (!isWorkspaceInitialized(workspacePath)) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_FILE_NOT_FOUND,
          message: '工作区未初始化，请先运行 ai-dev init',
          recovery: '请先运行 ai-dev init 初始化工作区',
        }),
        flags,
      )
      return
    }

    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      const state = loadRuntimeState(workspacePath) ?? createInitialRuntimeState()
      const paths = resolveWorkspacePaths(workspacePath)

      if (!state.sessionId) {
        const timestamp = new Date().toISOString()
        const sessionId = generateSessionId()

        state.sessionId = sessionId
        state.stage = 'RESEARCH'
        state.lastTransition = {
          from: 'IDLE',
          reason: '初始化工作流',
          timestamp,
          to: 'RESEARCH',
        }
        state.updatedAt = timestamp

        appendAuditEvent(paths.eventsPath, {
          actor: 'system',
          contextRef: null,
          event: 'workspace_initialized',
          metadata: {
            'workspace_path': workspacePath,
          },
          reason: '首次运行 next 初始化工作流',
          sessionId,
          stage: 'IDLE',
          ts: timestamp,
        })

        const transitionEvent = appendAuditEvent(paths.eventsPath, {
          actor: 'system',
          contextRef: null,
          event: 'stage_transition',
          metadata: {
            'from_stage': 'IDLE',
            'to_stage': 'RESEARCH',
          },
          reason: '初始化工作流',
          sessionId,
          stage: 'RESEARCH',
          ts: timestamp,
        })

        state.lastEventId = transitionEvent.event_id
        state.lastEventChecksum = transitionEvent.checksum
        saveRuntimeState(workspacePath, state)
      }

      const finalStage = state.stage
      const suggestion = {
        allowedActions: getAllowedActions(finalStage),
        currentStage: finalStage,
        gateRequired: isGateRequired(finalStage),
        reason: getTransitionReason(finalStage),
        recommendedAction: getRecommendedAction(finalStage),
      }

      outputResult(
        this,
        success({
          currentStage: finalStage,
          message: '已生成下一步建议',
          nextStep: '执行 ai-dev handoff 切换 Agent 或 ai-dev approve/reject/other 处理 Gate',
          sessionId: state.sessionId,
          suggestion,
        }),
        flags,
      )
    } catch (error_) {
      const lockError = toLockError(error_)
      if (lockError) {
        outputResult(
          this,
          failure({
            code: lockError.code,
            details: lockError.details,
            message: lockError.message,
            recovery: lockError.recovery,
          }),
          flags,
        )
        return
      }

      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `执行失败: ${(error_ as Error).message}`,
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }),
        flags,
      )
    } finally {
      releaseLock?.()
    }
  }
}

/** 获取允许动作 */
function getAllowedActions(stage: string): string[] {
  const actions = ['next']

  if (stage !== 'IDLE' && stage !== 'RECOVER') {
    actions.push('handoff')
  }

  if (stage === 'RESEARCH' || stage === 'PLAN' || stage === 'REVIEW') {
    actions.push('approve', 'reject', 'other')
  }

  return actions
}

/** 获取推荐动作 */
function getRecommendedAction(stage: string): string {
  const recommendations: Record<string, string> = {
    EXECUTE: 'next',
    IDLE: 'next',
    IMPLEMENT: 'next',
    PLAN: 'next',
    RECOVER: 'next',
    RESEARCH: 'handoff',
    REVIEW: 'approve',
  }
  return recommendations[stage] || 'next'
}

/** 检查是否需要 Gate */
function isGateRequired(stage: string): boolean {
  const gateStages = ['RESEARCH', 'PLAN', 'REVIEW']
  return gateStages.includes(stage)
}

/** 获取迁移原因 */
function getTransitionReason(stage: string): string {
  const reasons: Record<string, string> = {
    EXECUTE: '执行完成',
    IDLE: '初始状态',
    IMPLEMENT: '执行开发任务',
    PLAN: '制定实现计划',
    RECOVER: '从中断恢复',
    RESEARCH: '收集需求与分析',
    REVIEW: '进行代码审查',
  }
  return reasons[stage] || '未知阶段'
}

/** 生成会话 ID */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function toLockError(error_: unknown): null | {
  code: (typeof ErrorCodes)[keyof typeof ErrorCodes]
  details: Record<string, unknown>
  message: string
  recovery: string
} {
  const error = error_ as Error
  if (error.name !== ErrorCodes.LOCK_CONFLICT && error.name !== ErrorCodes.LOCK_STALE_TAKEOVER_FAILED) {
    return null
  }

  let details: Record<string, unknown> = {}
  try {
    details = JSON.parse(error.message) as Record<string, unknown>
  } catch {
    details = {raw: error.message}
  }

  const code = error.name as (typeof ErrorCodes)[keyof typeof ErrorCodes]
  return {
    code,
    details,
    message: code === ErrorCodes.LOCK_CONFLICT ? '工作区被锁定，无法并发执行' : 'stale lock 接管失败',
    recovery: RecoveryActions[code],
  }
}
