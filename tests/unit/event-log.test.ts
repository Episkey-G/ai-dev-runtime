import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import {
  appendAuditEvent,
  CURRENT_SCHEMA_VERSION,
  readEventsStrict,
  validateChecksumChain,
  validateSchemaCompatibility,
  verifySnapshotAnchor,
} from '../../src/core/event-log.js'

describe('event-log', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('appendAuditEvent 应生成可校验 checksum chain', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-event-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')

    appendAuditEvent(eventsPath, {
      actor: 'system',
      event: 'workspace_initialized',
      sessionId: 'session_1',
      stage: 'IDLE',
    })
    appendAuditEvent(eventsPath, {
      actor: 'system',
      event: 'stage_transition',
      metadata: {'to_stage': 'RESEARCH'},
      sessionId: 'session_1',
      stage: 'RESEARCH',
    })

    const events = readEventsStrict(eventsPath)
    const checksum = validateChecksumChain(events)
    expect(checksum.valid).toBe(true)
    expect(events[0].schema_version).toBe(CURRENT_SCHEMA_VERSION)
    expect(events[1].prev_checksum).toBe(events[0].checksum)
  })

  it('verifySnapshotAnchor 应校验 state anchor 与末尾事件一致', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-anchor-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')

    const event = appendAuditEvent(eventsPath, {
      actor: 'human',
      decision: 'approve',
      event: 'gate_decision',
      sessionId: 'session_2',
      stage: 'RESEARCH',
    })

    const events = readEventsStrict(eventsPath)
    const error = verifySnapshotAnchor(events, {
      lastEventChecksum: event.checksum,
      lastEventId: event.event_id,
    })
    expect(error).toBeNull()
  })

  it('readEventsStrict 遇到损坏 JSON 行应抛错', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-corrupt-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')
    appendAuditEvent(eventsPath, {
      actor: 'system',
      event: 'workspace_initialized',
      sessionId: 'session_1',
      stage: 'IDLE',
    })
    fs.appendFileSync(eventsPath, 'not-json\n')

    expect(() => readEventsStrict(eventsPath)).toThrow(/不是合法 JSON/)
  })

  it('validateSchemaCompatibility 遇到不兼容 schema_version 应失败', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-schema-'))
    dirs.push(workspace)
    const eventsPath = path.join(workspace, 'events.jsonl')

    const event = appendAuditEvent(eventsPath, {
      actor: 'system',
      event: 'workspace_initialized',
      sessionId: 'session_3',
      stage: 'IDLE',
    })
    const events = readEventsStrict(eventsPath)
    events[0] = {...event, 'schema_version': '9.9.9'}

    const result = validateSchemaCompatibility(events)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('schema_version 不兼容')
  })
})
