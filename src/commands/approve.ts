import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {appendAuditEvent} from '../core/event-log.js'
import {applyGateDecision, GATE_STAGES} from '../core/gate-decision.js'
import {acquireWorkspaceLock} from '../core/workspace-lock.js'
import {
  isWorkspaceInitialized,
  loadRuntimeState,
  resolveWorkspacePaths,
  saveRuntimeState,
} from '../core/workspace-store.js'

/** 批准当前 Gate 决策 */
export default class Approve extends Command {
  static override description = '批准当前 Gate 决策'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    reason: Flags.string({description: '审批理由（可选）'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Approve)
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

      const state = loadRuntimeState(workspacePath)
      if (!state) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.CFG_VALIDATION_FAILED,
            message: '状态文件不存在',
            recovery: '请先运行 ai-dev next 初始化状态',
          }),
          flags,
        )
        return
      }

      if (!state.sessionId) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.CFG_VALIDATION_FAILED,
            message: '会话未初始化',
            recovery: '请先运行 ai-dev next 初始化会话',
          }),
          flags,
        )
        return
      }

      if (!GATE_STAGES.has(state.stage)) {
        outputResult(
          this,
          success({
            action: 'approved',
            message: `当前阶段 ${state.stage} 不需要 Gate 决策`,
            stage: state.stage,
          }),
          flags,
        )
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, state: newState} = applyGateDecision({
        decision: 'approve',
        reason: flags.reason,
        state,
      })

      const gateDecisionEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'approve',
        event: 'gate_decision',
        metadata: {
          'next_stage': nextStage,
        },
        reason: flags.reason ?? 'Gate approved',
        sessionId: state.sessionId,
        stage: state.stage,
      })

      let lastEvent = gateDecisionEvent
      if (nextStage) {
        lastEvent = appendAuditEvent(paths.eventsPath, {
          actor: 'system',
          event: 'stage_transition',
          metadata: {
            decision: 'approve',
            'from_stage': state.stage,
            'to_stage': nextStage,
          },
          reason: flags.reason ?? 'Gate approved',
          sessionId: state.sessionId,
          stage: nextStage,
        })
      }

      newState.lastEventChecksum = lastEvent.checksum
      newState.lastEventId = lastEvent.event_id
      saveRuntimeState(workspacePath, newState)

      outputResult(
        this,
        success({
          action: 'approved',
          gateDecisions: newState.gateDecisions ?? [],
          message: 'Gate 决策已批准',
          nextStage,
          stage: state.stage,
        }),
        flags,
      )
    } catch (error_) {
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
