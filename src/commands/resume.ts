import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {
  readEventsStrict,
  validateChecksumChain,
  validateSchemaCompatibility,
  verifySnapshotAnchor,
} from '../core/event-log.js'
import {isWorkspaceInitialized, loadRuntimeState, resolveWorkspacePaths} from '../core/workspace-store.js'

/** 从中断点恢复编排 */
export default class Resume extends Command {
  static override description = '从中断点恢复编排（含 preflight 校验）'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Resume)
    const workspacePath = path.resolve(flags['workspace-path'])

    if (!isWorkspaceInitialized(workspacePath)) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_FILE_NOT_FOUND,
          message: '工作区未初始化，请先运行 ai-dev init',
          recovery: RecoveryActions.CFG_FILE_NOT_FOUND,
        }),
        flags,
      )
      return
    }

    const state = loadRuntimeState(workspacePath)
    if (!state) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.RESUME_PREFLIGHT_FAILED,
          details: {missing: 'state.json'},
          message: 'Preflight 失败：状态文件不存在',
          recovery: RecoveryActions.RESUME_PREFLIGHT_FAILED,
        }),
        flags,
      )
      return
    }

    try {
      const {eventsPath} = resolveWorkspacePaths(workspacePath)
      const events = readEventsStrict(eventsPath)
      const schemaCheck = validateSchemaCompatibility(events)
      if (!schemaCheck.valid) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.RESUME_SCHEMA_INCOMPATIBLE,
            details: {errors: schemaCheck.errors},
            message: 'Preflight 失败：schema/upcaster 校验不通过',
            recovery: RecoveryActions.RESUME_SCHEMA_INCOMPATIBLE,
          }),
          flags,
        )
        return
      }

      const checksumCheck = validateChecksumChain(schemaCheck.events)
      if (!checksumCheck.valid) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.EVT_EVENT_CHECKSUM_INVALID,
            details: {errors: checksumCheck.errors},
            message: 'Preflight 失败：checksum chain 校验不通过',
            recovery: RecoveryActions.EVT_EVENT_CHECKSUM_INVALID,
          }),
          flags,
        )
        return
      }

      const anchorError = verifySnapshotAnchor(schemaCheck.events, state)
      if (anchorError) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.RESUME_SNAPSHOT_ANCHOR_MISMATCH,
            details: {error: anchorError},
            message: 'Preflight 失败：snapshot anchor 校验不通过',
            recovery: RecoveryActions.RESUME_SNAPSHOT_ANCHOR_MISMATCH,
          }),
          flags,
        )
        return
      }

      const recentEvents = schemaCheck.events.slice(-10).map((event) => ({
        checksum: event.checksum,
        event: event.event,
        'event_id': event.event_id,
        stage: event.stage,
        ts: event.ts,
      }))

      outputResult(
        this,
        success({
          message: '恢复成功',
          nextStep: '执行 ai-dev next 继续工作流',
          preflight: {
            'checksum_chain': 'passed',
            'schema_compatibility': 'passed',
            'snapshot_anchor': 'passed',
            'upcasted_events': schemaCheck.upcasted,
          },
          recentEvents,
          sessionId: state.sessionId,
          stage: state.stage,
        }),
        flags,
      )
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.EVT_EVENT_CORRUPT,
          message: `Preflight 失败：事件日志损坏 - ${(error_ as Error).message}`,
          recovery: RecoveryActions.EVT_EVENT_CORRUPT,
        }),
        flags,
      )
    }
  }
}
