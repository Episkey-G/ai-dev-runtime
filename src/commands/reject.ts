import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {appendAuditEvent} from '../core/event-log.js'
import {applyGateDecision, DEFAULT_GATE_POLICY_NAME, GATE_POLICY_NAMES, GATE_STAGES} from '../core/gate-decision.js'
import {acquireWorkspaceLock} from '../core/workspace-lock.js'
import {
  isWorkspaceInitialized,
  loadRuntimeState,
  resolveWorkspacePaths,
  saveRuntimeState,
} from '../core/workspace-store.js'

/** 拒绝当前 Gate 决策 */
export default class Reject extends Command {
  static override description = '拒绝当前 Gate 决策'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    policy: Flags.string({
      default: DEFAULT_GATE_POLICY_NAME,
      description: 'Gate 策略名称',
      options: GATE_POLICY_NAMES,
    }),
    reason: Flags.string({description: '拒绝理由', required: true}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Reject)
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
            action: 'rejected',
            message: `当前阶段 ${state.stage} 不需要 Gate 决策`,
            stage: state.stage,
          }),
          flags,
        )
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, policyName, state: newState} = applyGateDecision({
        decision: 'reject',
        policyName: flags.policy,
        reason: flags.reason,
        state,
      })

      const gateDecisionEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'reject',
        event: 'gate_decision',
        metadata: {
          'next_stage': nextStage,
          'policy_name': policyName,
        },
        reason: flags.reason,
        sessionId: state.sessionId,
        stage: state.stage,
      })

      let lastEvent = gateDecisionEvent
      if (nextStage) {
        lastEvent = appendAuditEvent(paths.eventsPath, {
          actor: 'system',
          event: 'stage_transition',
          metadata: {
            decision: 'reject',
            'from_stage': state.stage,
            'to_stage': nextStage,
          },
          reason: flags.reason,
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
          action: 'rejected',
          gateDecisions: newState.gateDecisions ?? [],
          message: 'Gate 决策已拒绝',
          nextStage,
          policyName,
          reason: flags.reason,
          stage: state.stage,
        }),
        flags,
      )
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `reject 执行失败: ${(error_ as Error).message}`,
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }),
        flags,
      )
    } finally {
      releaseLock?.()
    }
  }
}
