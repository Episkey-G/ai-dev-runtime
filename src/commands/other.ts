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

/** 提交 Gate 自定义决策（非 approve/reject） */
export default class Other extends Command {
  static override description = '提交 Gate 自定义决策（非 approve/reject）'
  static override flags = {
    direction: Flags.string({description: '替代方向', required: true}),
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    reason: Flags.string({description: '决策备注（可选）'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Other)
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
      if (!state || !state.sessionId) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.CFG_VALIDATION_FAILED,
            message: '状态或会话不存在，请先运行 ai-dev next',
            recovery: '执行 ai-dev next 初始化状态',
          }),
          flags,
        )
        return
      }

      if (!GATE_STAGES.has(state.stage)) {
        outputResult(
          this,
          success({
            action: 'other',
            message: `当前阶段 ${state.stage} 不需要 Gate 决策`,
            stage: state.stage,
          }),
          flags,
        )
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, state: newState} = applyGateDecision({
        decision: 'other',
        direction: flags.direction,
        reason: flags.reason,
        state,
      })

      const lastEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'other',
        event: 'gate_decision',
        metadata: {
          direction: flags.direction,
          'next_stage': nextStage,
        },
        reason: flags.reason ?? flags.direction,
        sessionId: state.sessionId,
        stage: state.stage,
      })

      newState.lastEventChecksum = lastEvent.checksum
      newState.lastEventId = lastEvent.event_id
      saveRuntimeState(workspacePath, newState)

      outputResult(
        this,
        success({
          action: 'other',
          direction: flags.direction,
          gateDecisions: newState.gateDecisions ?? [],
          message: 'Gate 自定义决策已记录',
          nextStage,
          reason: flags.reason ?? null,
          stage: state.stage,
        }),
        flags,
      )
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `other 执行失败: ${(error_ as Error).message}`,
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }),
        flags,
      )
    } finally {
      releaseLock?.()
    }
  }
}
