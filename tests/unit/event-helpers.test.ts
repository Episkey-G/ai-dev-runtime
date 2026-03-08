import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import type {AgentIntent} from '../../src/adapters/types.js'

import {
  findCachedAgentOutcome,
  findPendingAgentRecoveryState,
  hasIntentCheckpoint,
  writeAgentCompensation,
  writeAgentIntent,
  writeAgentResult,
} from '../../src/adapters/event-helpers.js'
import {readEventsStrict} from '../../src/core/event-log.js'

describe('event-helpers', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('应写入 agent_intent/agent_result 事件并支持缓存读取', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-agent-event-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')
    const intent: AgentIntent = {
      agentId: 'claude',
      eventsPath,
      intentId: 'intent_1',
      sessionId: 'session_1',
      stage: 'IMPLEMENT',
      task: 'write tests',
    }

    writeAgentIntent(intent, {eventsPath, stage: 'IMPLEMENT'})
    writeAgentResult(intent, {eventsPath, stage: 'IMPLEMENT'}, {intentId: 'intent_1', output: 'ok', success: true})
    expect(hasIntentCheckpoint(intent)).toBe(true)

    const events = readEventsStrict(eventsPath)
    expect(events.map((event) => event.event)).toEqual(['agent_intent', 'agent_result'])

    const cached = findCachedAgentOutcome(intent)
    expect(cached).toEqual({
      intentId: 'intent_1',
      output: 'ok',
      success: true,
    })
  })

  it('应写入 agent_compensation 事件并返回缓存失败结果', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-agent-compensation-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')
    const intent: AgentIntent = {
      agentId: 'codex',
      eventsPath,
      intentId: 'intent_2',
      sessionId: 'session_2',
      stage: 'RESEARCH',
      task: 'analyze architecture',
    }

    writeAgentIntent(intent, {eventsPath, stage: 'RESEARCH'})
    writeAgentCompensation(
      intent,
      {eventsPath, stage: 'RESEARCH'},
      {
        error: {
          code: 'CONNECTOR_TIMEOUT',
          details: {timeoutMs: 120_000},
          message: 'timeout',
        },
        intentId: 'intent_2',
        output: '',
        success: false,
      },
    )

    const cached = findCachedAgentOutcome(intent)
    expect(cached?.success).toBe(false)
    expect(cached?.error?.code).toBe('CONNECTOR_TIMEOUT')
    expect(cached?.error?.details).toEqual({timeoutMs: 120_000})
  })

  it('应识别未完成的 agent_intent 作为恢复状态', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-agent-recovery-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')

    const pendingIntent: AgentIntent = {
      agentId: 'claude',
      eventsPath,
      intentId: 'intent_pending',
      sessionId: 'session_recover',
      stage: 'IMPLEMENT',
      task: 'do risky op',
    }

    const completedIntent: AgentIntent = {
      agentId: 'codex',
      eventsPath,
      intentId: 'intent_done',
      sessionId: 'session_recover',
      stage: 'PLAN',
      task: 'summarize',
    }

    writeAgentIntent(completedIntent, {eventsPath, stage: 'PLAN'})
    writeAgentResult(
      completedIntent,
      {eventsPath, stage: 'PLAN'},
      {intentId: 'intent_done', output: 'done', success: true},
    )
    writeAgentIntent(pendingIntent, {eventsPath, stage: 'IMPLEMENT'})

    const events = readEventsStrict(eventsPath)
    const pending = findPendingAgentRecoveryState(events, 'session_recover')

    expect(pending).toEqual({
      agentId: 'claude',
      intentId: 'intent_pending',
      stage: 'IMPLEMENT',
      timestamp: expect.any(String),
    })
  })
})
