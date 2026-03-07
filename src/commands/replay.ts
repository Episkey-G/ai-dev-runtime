import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {
  buildReplayCheckpoints,
  readEventsStrict,
  selectReplayEvents,
  validateChecksumChain,
  validateSchemaCompatibility,
} from '../core/event-log.js'
import {isWorkspaceInitialized, loadRuntimeState, resolveWorkspacePaths} from '../core/workspace-store.js'

/** 确定性回放事件序列 */
export default class Replay extends Command {
  static override description = '确定性回放事件序列（checkpoint-based）'
  static override flags = {
    'checkpoint-size': Flags.integer({
      default: 20,
      description: 'checkpoint 分段大小',
    }),
    'from-event-id': Flags.integer({
      description: '从指定 event_id 开始回放（可选）',
    }),
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    limit: Flags.integer({
      default: 50,
      description: '回放最近 N 条事件',
    }),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Replay)
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

    try {
      const {eventsPath} = resolveWorkspacePaths(workspacePath)
      const events = readEventsStrict(eventsPath)
      if (events.length === 0) {
        outputResult(
          this,
          success({
            checkpoints: [],
            events: [],
            message: '事件日志为空',
            replayed: 0,
            total: 0,
          }),
          flags,
        )
        return
      }

      const schemaCheck = validateSchemaCompatibility(events)
      if (!schemaCheck.valid) {
        outputResult(
          this,
          failure({
            code: ErrorCodes.RESUME_SCHEMA_INCOMPATIBLE,
            details: {errors: schemaCheck.errors},
            message: '事件 schema 不兼容，无法 deterministic replay',
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
            message: '事件 checksum 校验失败，已 hard-stop 回放',
            recovery: RecoveryActions.EVT_EVENT_CHECKSUM_INVALID,
          }),
          flags,
        )
        return
      }

      const checkpoints = buildReplayCheckpoints(schemaCheck.events, flags['checkpoint-size'])
      const state = loadRuntimeState(workspacePath)
      const stateAnchor = typeof state?.lastEventId === 'number' ? state.lastEventId : undefined

      const replayFromEventId = flags['from-event-id'] ?? resolveCheckpointStart(checkpoints, stateAnchor)
      const replayEvents = selectReplayEvents(schemaCheck.events, flags.limit, replayFromEventId)

      outputResult(
        this,
        success({
          checkpoints,
          checkpointSize: flags['checkpoint-size'],
          events: replayEvents,
          message: `deterministic replay 完成（from event_id=${replayFromEventId ?? 1}）`,
          replayed: replayEvents.length,
          total: schemaCheck.events.length,
        }),
        flags,
      )
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.EVT_EVENT_CORRUPT,
          message: `回放失败：事件日志损坏 - ${(error_ as Error).message}`,
          recovery: RecoveryActions.EVT_EVENT_CORRUPT,
        }),
        flags,
      )
    }
  }
}

function resolveCheckpointStart(
  checkpoints: Array<Record<'end_event_id' | 'start_event_id', number>>,
  anchor?: number,
): number | undefined {
  if (!anchor) {
    return undefined
  }

  const checkpoint = checkpoints.find((item) => anchor >= item.start_event_id && anchor <= item.end_event_id)
  return checkpoint?.start_event_id
}
