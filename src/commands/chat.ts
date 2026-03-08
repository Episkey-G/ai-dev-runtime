/* eslint-disable camelcase */

import {Command, Flags} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'
import {createInterface} from 'node:readline'

import {
  AdapterRouter,
  AGENTS,
  ClaudeAdapter,
  CodexAdapter,
  type ContextPacket,
} from '../adapters/index.js'
import {ErrorCodes} from '../cli/error-codes.js'
import {
  appendAuditEvent,
  type AuditEvent,
  buildReplayCheckpoints,
  CURRENT_SCHEMA_VERSION,
  readEventsStrict,
  selectReplayEvents,
  validateChecksumChain,
  validateSchemaCompatibility,
} from '../core/event-log.js'
import {applyGateDecision, GATE_STAGES} from '../core/gate-decision.js'
import {acquireWorkspaceLock} from '../core/workspace-lock.js'
import {
  createInitialRuntimeState,
  isWorkspaceInitialized,
  loadRuntimeState,
  resolveWorkspacePaths,
  saveRuntimeState,
} from '../core/workspace-store.js'
import {validateContextPacket} from '../lib/schemas.js'

interface SessionSnapshot {
  agentId: keyof typeof AGENTS
  sessionId: null | string
  stage: string
}

/** Chat 命令：进入交互式 REPL */
export default class Chat extends Command {
  static override description = '进入交互式 REPL 会话'
  static override flags = {
    'workspace-path': Flags.string({default: '.', description: '指定工作区路径'}),
  }
private readonly router = new AdapterRouter({
    claude: new ClaudeAdapter(),
    codex: new CodexAdapter(),
  })

  async run(): Promise<void> {
    const {flags} = await this.parse(Chat)
    const workspacePath = path.resolve(flags['workspace-path'])

    if (!isWorkspaceInitialized(workspacePath)) {
      this.error(`[${ErrorCodes.CFG_FILE_NOT_FOUND}] 工作区未初始化，请先运行 ai-dev init`)
      return
    }

    this.log('进入交互模式，输入 /help 查看可用命令。')

    const rl = createInterface({
      historySize: 500,
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })

    let closedBySignal = false
    rl.on('SIGINT', () => {
      closedBySignal = true
      rl.close()
    })

    rl.setPrompt(this.buildPrompt(workspacePath))
    rl.prompt()

    try {
      for await (const line of rl) {
        const input = line.trim()
        if (input.length === 0) {
          rl.setPrompt(this.buildPrompt(workspacePath))
          rl.prompt()
          continue
        }

        if (input.startsWith('/')) {
          const shouldContinue = await this.handleSlashCommand(workspacePath, input)
          if (!shouldContinue) {
            rl.close()
            break
          }
        } else {
          await this.routeChatInput(workspacePath, input)
        }

        rl.setPrompt(this.buildPrompt(workspacePath))
        rl.prompt()
      }
    } finally {
      rl.close()
      if (closedBySignal) {
        this.log('已退出 ai-dev chat')
      }
    }
  }

  private buildPrompt(workspacePath: string): string {
    const snapshot = this.readSessionSnapshot(workspacePath)
    return `[${snapshot.stage}|${snapshot.agentId}|${snapshot.sessionId ?? 'no-session'}] > `
  }

  private async handleApprove(workspacePath: string, reason?: string): Promise<void> {
    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      const state = loadRuntimeState(workspacePath)
      if (!state || !state.sessionId) {
        this.log('状态或会话不存在，请先执行 /next。')
        return
      }

      if (!GATE_STAGES.has(state.stage)) {
        this.log(`当前阶段 ${state.stage} 不需要 Gate 决策。`)
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, state: newState} = applyGateDecision({
        decision: 'approve',
        reason,
        state,
      })

      const gateDecisionEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'approve',
        event: 'gate_decision',
        metadata: {
          next_stage: nextStage,
        },
        reason: reason ?? 'Gate approved',
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
            from_stage: state.stage,
            to_stage: nextStage,
          },
          reason: reason ?? 'Gate approved',
          sessionId: state.sessionId,
          stage: nextStage,
        })
      }

      newState.lastEventChecksum = lastEvent.checksum
      newState.lastEventId = lastEvent.event_id
      saveRuntimeState(workspacePath, newState)

      this.log(`Gate 已批准。${nextStage ? `下一阶段: ${nextStage}` : '阶段保持不变。'}`)
    } catch (error_) {
      this.log(`执行 /approve 失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private async handleHandoff(workspacePath: string, toAgent?: string): Promise<void> {
    const targetAgent = toAgent ?? this.toggleAgent(workspacePath)

    if (!AGENTS[targetAgent]) {
      this.log(`未知 Agent: ${targetAgent ?? '(空)'}。可用: ${Object.keys(AGENTS).join(', ')}`)
      return
    }

    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      const state = loadRuntimeState(workspacePath)
      if (!state?.sessionId) {
        this.log('会话未初始化，请先执行 /next。')
        return
      }

      const fromAgent = (state.executor as string | undefined) ?? 'claude'
      const timestamp = new Date().toISOString()
      const intentId = `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const packet: ContextPacket = {
        context: {
          pending_tasks: [],
          recent_events: this.listRecentEvents(resolveWorkspacePaths(workspacePath).eventsPath, state.sessionId, 10),
          state,
        },
        from_agent: fromAgent,
        intent_id: intentId,
        schema_version: CURRENT_SCHEMA_VERSION,
        session_id: state.sessionId,
        stage: state.stage,
        timestamp,
        to_agent: targetAgent,
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
          to_agent: targetAgent,
        },
        reason: '跨 Agent 上下文交接',
        sessionId: state.sessionId,
        stage: state.stage,
      })

      state.executor = targetAgent
      state.lastEventChecksum = event.checksum
      state.lastEventId = event.event_id
      state.updatedAt = timestamp
      saveRuntimeState(workspacePath, state)

      this.log(`已切换 Agent: ${fromAgent} -> ${targetAgent}`)
    } catch (error_) {
      this.log(`执行 /handoff 失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private async handleNext(workspacePath: string): Promise<void> {
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
            workspace_path: workspacePath,
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
            from_stage: 'IDLE',
            to_stage: 'RESEARCH',
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

      this.log(`当前阶段: ${state.stage}`)
      this.log(`建议动作: ${getRecommendedAction(state.stage)}`)
      this.log(`可用动作: ${getAllowedActions(state.stage).join(', ')}`)
    } catch (error_) {
      this.log(`执行 /next 失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private async handleOther(workspacePath: string, direction?: string, reason?: string): Promise<void> {
    if (!direction) {
      this.log('用法: /other <direction> [reason]')
      return
    }

    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      const state = loadRuntimeState(workspacePath)
      if (!state || !state.sessionId) {
        this.log('状态或会话不存在，请先执行 /next。')
        return
      }

      if (!GATE_STAGES.has(state.stage)) {
        this.log(`当前阶段 ${state.stage} 不需要 Gate 决策。`)
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, state: newState} = applyGateDecision({
        decision: 'other',
        direction,
        reason,
        state,
      })

      const lastEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'other',
        event: 'gate_decision',
        metadata: {
          direction,
          next_stage: nextStage,
        },
        reason: reason ?? direction,
        sessionId: state.sessionId,
        stage: state.stage,
      })

      newState.lastEventChecksum = lastEvent.checksum
      newState.lastEventId = lastEvent.event_id
      saveRuntimeState(workspacePath, newState)

      this.log(`Gate 已记录自定义决策: ${direction}`)
    } catch (error_) {
      this.log(`执行 /other 失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private async handleReject(workspacePath: string, reason: string): Promise<void> {
    if (!reason) {
      this.log('用法: /reject <reason>')
      return
    }

    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      const state = loadRuntimeState(workspacePath)
      if (!state || !state.sessionId) {
        this.log('状态或会话不存在，请先执行 /next。')
        return
      }

      if (!GATE_STAGES.has(state.stage)) {
        this.log(`当前阶段 ${state.stage} 不需要 Gate 决策。`)
        return
      }

      const paths = resolveWorkspacePaths(workspacePath)
      const {nextStage, state: newState} = applyGateDecision({
        decision: 'reject',
        reason,
        state,
      })

      const gateDecisionEvent = appendAuditEvent(paths.eventsPath, {
        actor: 'human',
        decision: 'reject',
        event: 'gate_decision',
        metadata: {
          next_stage: nextStage,
        },
        reason,
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
            from_stage: state.stage,
            to_stage: nextStage,
          },
          reason,
          sessionId: state.sessionId,
          stage: nextStage,
        })
      }

      newState.lastEventChecksum = lastEvent.checksum
      newState.lastEventId = lastEvent.event_id
      saveRuntimeState(workspacePath, newState)

      this.log(`Gate 已拒绝。${nextStage ? `下一阶段: ${nextStage}` : '阶段保持不变。'}`)
    } catch (error_) {
      this.log(`执行 /reject 失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private async handleSlashCommand(workspacePath: string, input: string): Promise<boolean> {
    const [command, ...args] = input.slice(1).split(/\s+/)

    switch (command) {
      case 'approve': {
        const reason = args.join(' ').trim() || undefined
        await this.handleApprove(workspacePath, reason)
        return true
      }

      case 'handoff': {
        const toAgent = args[0]
        await this.handleHandoff(workspacePath, toAgent)
        return true
      }

      case 'help': {
        this.printHelp()
        return true
      }

      case 'history': {
        const limit = parsePositiveInt(args[0], 20)
        this.printHistory(workspacePath, limit)
        return true
      }

      case 'next': {
        await this.handleNext(workspacePath)
        return true
      }

      case 'other': {
        const direction = args[0]
        const reason = args.slice(1).join(' ').trim() || undefined
        await this.handleOther(workspacePath, direction, reason)
        return true
      }

      case 'quit': {
        this.log('结束会话。')
        return false
      }

      case 'reject': {
        const reason = args.join(' ').trim()
        await this.handleReject(workspacePath, reason)
        return true
      }

      case 'replay': {
        const limit = parsePositiveInt(args[0], 20)
        this.printReplay(workspacePath, limit)
        return true
      }

      case 'stage': {
        this.printStage(workspacePath)
        return true
      }

      default: {
        this.log(`未知命令: /${command}，输入 /help 查看可用命令。`)
        return true
      }
    }
  }

  private listRecentEvents(eventsPath: string, sessionId: string, limit: number): string[] {
    const events = readEventsStrict(eventsPath)
      .filter((event) => event.session_id === sessionId)
      .slice(-limit)

    return events.map((event) => formatEvent(event))
  }

  private printHelp(): void {
    this.log('可用命令:')
    this.log('/help                  显示帮助')
    this.log('/stage                 查看当前 stage/agent/session')
    this.log('/next                  初始化或查看下一步建议')
    this.log('/handoff [agent]       切换 Agent (claude/codex，不传则自动切换)')
    this.log('/approve [reason]      批准当前 Gate')
    this.log('/reject <reason>       拒绝当前 Gate')
    this.log('/other <direction> [reason]  记录自定义 Gate 决策')
    this.log('/history [limit]       查看当前会话历史（默认 20）')
    this.log('/replay [limit]        校验并回放事件（默认 20）')
    this.log('/quit                  退出 REPL')
  }

  private printHistory(workspacePath: string, limit: number): void {
    const paths = resolveWorkspacePaths(workspacePath)
    const state = loadRuntimeState(workspacePath)
    const events = readEventsStrict(paths.eventsPath)

    if (events.length === 0) {
      this.log('暂无历史事件。')
      return
    }

    const filtered = state?.sessionId
      ? events.filter((event) => event.session_id === state.sessionId)
      : events

    const selected = limit > 0 ? filtered.slice(-limit) : filtered
    if (selected.length === 0) {
      this.log('当前会话暂无历史事件。')
      return
    }

    for (const event of selected) {
      this.log(formatEvent(event))
    }
  }

  private printReplay(workspacePath: string, limit: number): void {
    try {
      const {eventsPath} = resolveWorkspacePaths(workspacePath)
      const events = readEventsStrict(eventsPath)
      if (events.length === 0) {
        this.log('事件日志为空。')
        return
      }

      const schemaCheck = validateSchemaCompatibility(events)
      if (!schemaCheck.valid) {
        this.log(`schema 校验失败: ${schemaCheck.errors.join(' | ')}`)
        return
      }

      const checksumCheck = validateChecksumChain(schemaCheck.events)
      if (!checksumCheck.valid) {
        this.log(`checksum 校验失败: ${checksumCheck.errors.join(' | ')}`)
        return
      }

      const checkpoints = buildReplayCheckpoints(schemaCheck.events, 20)
      const replayEvents = selectReplayEvents(schemaCheck.events, limit)

      this.log(`replay: ${replayEvents.length}/${schemaCheck.events.length}`)
      this.log(`checkpoints: ${checkpoints.length}`)
      for (const event of replayEvents) {
        this.log(formatEvent(event))
      }
    } catch (error_) {
      this.log(`执行 /replay 失败: ${(error_ as Error).message}`)
    }
  }

  private printStage(workspacePath: string): void {
    const state = loadRuntimeState(workspacePath) ?? createInitialRuntimeState()
    const {agentId} = this.router.route(state.stage, state.executor)

    this.log(`stage=${state.stage}`)
    this.log(`agent=${agentId}`)
    this.log(`session=${state.sessionId ?? '未初始化'}`)
    this.log(`gateRequired=${GATE_STAGES.has(state.stage)}`)
  }

  private readSessionSnapshot(workspacePath: string): SessionSnapshot {
    const state = loadRuntimeState(workspacePath) ?? createInitialRuntimeState()
    const {agentId} = this.router.route(state.stage, state.executor)

    return {
      agentId,
      sessionId: state.sessionId,
      stage: state.stage,
    }
  }

  private async routeChatInput(workspacePath: string, input: string): Promise<void> {
    const paths = resolveWorkspacePaths(workspacePath)
    const state = loadRuntimeState(workspacePath)

    if (!state?.sessionId) {
      this.log('当前没有活动会话，请先执行 /next 初始化会话。')
      return
    }

    const recentEvents = this.listRecentEvents(paths.eventsPath, state.sessionId, 8)
    const adapter = this.router.route(state.stage, state.executor)
    const intentId = `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const task = buildContextPrompt({
      agentId: adapter.agentId,
      input,
      recentEvents,
      sessionId: state.sessionId,
      stage: state.stage,
    })

    let releaseLock: (() => void) | null = null

    try {
      const lock = acquireWorkspaceLock(workspacePath)
      releaseLock = lock.release

      this.log(`${AGENTS[adapter.agentId].name} 正在处理...`)
      const result = await adapter.execute({
        agentId: adapter.agentId,
        eventsPath: paths.eventsPath,
        intentId,
        sessionId: state.sessionId,
        stage: state.stage,
        task,
      })

      if (result.success) {
        this.log(result.output || '(空响应)')
      } else {
        this.log(`调用失败 [${result.error?.code ?? ErrorCodes.CONNECTOR_INVOCATION_FAILED}] ${result.error?.message ?? '未知错误'}`)
      }
    } catch (error_) {
      this.log(`处理失败: ${(error_ as Error).message}`)
    } finally {
      releaseLock?.()
    }
  }

  private toggleAgent(workspacePath: string): keyof typeof AGENTS {
    const state = loadRuntimeState(workspacePath) ?? createInitialRuntimeState()
    const current = this.router.route(state.stage, state.executor).agentId
    return current === 'claude' ? 'codex' : 'claude'
  }
}

function buildContextPrompt(input: {
  agentId: string
  input: string
  recentEvents: string[]
  sessionId: string
  stage: string
}): string {
  const recent = input.recentEvents.length > 0 ? input.recentEvents.join('\n') : '无'

  return [
    '你是 ai-dev runtime 的执行代理。',
    `current_stage: ${input.stage}`,
    `current_agent: ${input.agentId}`,
    `session_id: ${input.sessionId}`,
    'recent_events:',
    recent,
    'user_input:',
    input.input,
  ].join('\n')
}

function formatEvent(event: AuditEvent): string {
  return `#${event.event_id} [${event.ts}] ${event.event} stage=${event.stage} actor=${event.actor}`
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

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

function parsePositiveInt(raw: string | undefined, fallbackValue: number): number {
  if (!raw) {
    return fallbackValue
  }

  const value = Number.parseInt(raw, 10)
  if (Number.isNaN(value) || value <= 0) {
    return fallbackValue
  }

  return value
}

function safeFilenameTimestamp(timestamp: string): string {
  return timestamp.replaceAll(':', '-')
}

function saveContextPacket(contextPath: string, packet: ContextPacket): void {
  if (!fs.existsSync(contextPath)) {
    fs.mkdirSync(contextPath, {recursive: true})
  }

  const validatedPacket = validateContextPacket(packet)
  const file = `handoff-${safeFilenameTimestamp(validatedPacket.timestamp)}.json`
  fs.writeFileSync(path.join(contextPath, file), JSON.stringify(validatedPacket, null, 2))
}
