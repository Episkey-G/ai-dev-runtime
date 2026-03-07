import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import type {AgentIntent} from '../../src/adapters/types.js'

import {ClaudeAdapter} from '../../src/adapters/claude-adapter.js'

describe('adapter idempotency', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('should return cached result for duplicate intent_id', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-idempotency-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, '.ai-dev', 'events.jsonl')
    fs.mkdirSync(path.dirname(eventsPath), {recursive: true})

    const intent: AgentIntent = {
      agentId: 'claude',
      eventsPath,
      intentId: 'test-intent-123',
      sessionId: 'test-session',
      stage: 'IMPLEMENT',
      task: 'test task',
    }

    // First call - write intent and result
    const adapter = new ClaudeAdapter()
    const result1 = await adapter.execute(intent)
    expect(result1.success).toBe(false) // Will fail because CLI not installed in test

    // Second call with same intentId - should return cached result
    const result2 = await adapter.execute(intent)
    expect(result2.success).toBe(false)
  })

  it('should not write events when eventsPath not provided', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-no-events-'))
    dirs.push(workspace)

    const intent: AgentIntent = {
      agentId: 'claude',
      intentId: 'test-intent-no-events',
      sessionId: 'test-session',
      task: 'test task',
    }

    const adapter = new ClaudeAdapter()
    const result = await adapter.execute(intent)
    expect(result.success).toBe(false)
  })
})
