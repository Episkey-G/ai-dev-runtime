/* eslint-disable camelcase */

import {Command, Flags} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {appendAuditEvent, CURRENT_SCHEMA_VERSION} from '../core/event-log.js'
import {acquireWorkspaceLock} from '../core/workspace-lock.js'
import {
  isWorkspaceInitialized,
  loadRuntimeState,
  resolveWorkspacePaths,
  type RuntimeState,
  saveRuntimeState,
} from '../core/workspace-store.js'

/** Agent 定义 */
export interface Agent {
  capabilities: string[]
  id: string
  name: string
  role: 'deepAnalyzer' | 'executor' | 'reviewer'
}

/** 可用 Agents */
export const AGENTS: Record<string, Agent> = {
  claude: {
    capabilities: ['code-generation', 'refactoring', 'testing'],
    id: 'claude',
    name: 'Claude',
    role: 'executor',
  },
  codex: {
    capabilities: ['code-review', 'analysis', 'architecture'],
    id: 'codex',
    name: 'Codex',
    role: 'deepAnalyzer',
  },
}

/** 上下文数据包（对外字段统一 snake_case） */
export interface ContextPacket {
  context: {
    pending_tasks: string[]
    recent_events: string[]
    state: RuntimeState
  }
  from_agent: string
  intent_id: string
  schema_version: string
  session_id: string
  stage: string
  timestamp: string
  to_agent: string
}

/** 执行跨 Agent 上下文交接 */
export default class Handoff extends Command {
  static override description = '执行跨 Agent 上下文交接'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    to: Flags.string({default: 'codex', description: '目标 Agent (claude/codex)'}),
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Handoff)
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

    if (!AGENTS[flags.to]) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `未知 Agent: ${flags.to}。可用: ${Object.keys(AGENTS).join(', ')}`,
          recovery: '请指定有效的 Agent (claude 或 codex)',
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
            message: '状态文件不存在或会话未初始化',
            recovery: '请先运行 ai-dev next 初始化状态',
          }),
          flags,
        )
        return
      }

      const fromAgent = (state.executor as string | undefined) ?? 'claude'
      const toAgent = flags.to
      const timestamp = new Date().toISOString()
      const intentId = `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const packet: ContextPacket = {
        context: {
          pending_tasks: [],
          recent_events: [],
          state,
        },
        from_agent: fromAgent,
        intent_id: intentId,
        schema_version: CURRENT_SCHEMA_VERSION,
        session_id: state.sessionId,
        stage: state.stage,
        timestamp,
        to_agent: toAgent,
      }

      const paths = resolveWorkspacePaths(workspacePath)
      saveContextPacket(paths.contextPath, packet)

      const event = appendAuditEvent(paths.eventsPath, {
        actor: 'system',
        contextRef: `context/handoff-${safeFilenameTimestamp(timestamp)}.json`,
        event: 'agent_handoff',
        intentId,
        metadata: {
          from_agent: fromAgent,
          schema_version: CURRENT_SCHEMA_VERSION,
          to_agent: toAgent,
        },
        reason: '跨 Agent 上下文交接',
        sessionId: state.sessionId,
        stage: state.stage,
      })

      state.executor = toAgent
      state.lastEventChecksum = event.checksum
      state.lastEventId = event.event_id
      state.updatedAt = timestamp
      saveRuntimeState(workspacePath, state)

      outputResult(
        this,
        success({
          context_packet: packet,
          from_agent: fromAgent,
          message: '上下文交接完成',
          next_step: `已切换到 ${AGENTS[toAgent].name}，可继续执行 ai-dev next`,
          stage: state.stage,
          to_agent: toAgent,
        }),
        flags,
      )
    } catch (error_) {
      outputResult(
        this,
        failure({
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `交接失败: ${(error_ as Error).message}`,
          recovery: RecoveryActions.CFG_VALIDATION_FAILED,
        }),
        flags,
      )
    } finally {
      releaseLock?.()
    }
  }
}

function safeFilenameTimestamp(timestamp: string): string {
  return timestamp.replaceAll(':', '-')
}

function saveContextPacket(contextPath: string, packet: ContextPacket): void {
  if (!fs.existsSync(contextPath)) {
    fs.mkdirSync(contextPath, {recursive: true})
  }

  const file = `handoff-${safeFilenameTimestamp(packet.timestamp)}.json`
  fs.writeFileSync(path.join(contextPath, file), JSON.stringify(packet, null, 2))
}
