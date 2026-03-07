/* eslint-disable camelcase */

import {createHash} from 'node:crypto'
import fs from 'node:fs'

export const CURRENT_SCHEMA_VERSION = '1.0.0'
export const AUDIT_EVENT_TYPES = [
  'agent_compensation',
  'agent_handoff',
  'agent_intent',
  'agent_result',
  'gate_decision',
  'stage_transition',
  'workspace_initialized',
] as const

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number]

type JsonValue =
  | boolean
  | JsonValue[]
  | null
  | number
  | string
  | {[key: string]: JsonValue}

export interface AuditEvent {
  actor: string
  checksum: string
  context_ref: null | string
  decision: null | string
  event: AuditEventType
  event_id: number
  intent_id: null | string
  metadata: Record<string, JsonValue>
  prev_checksum: null | string
  reason: null | string
  schema_version: string
  session_id: null | string
  stage: string
  ts: string
}

export interface AppendEventInput {
  actor: string
  contextRef?: null | string
  decision?: null | string
  event: AuditEventType
  intentId?: null | string
  metadata?: Record<string, JsonValue>
  reason?: null | string
  sessionId?: null | string
  stage: string
  ts?: string
}

export interface ChecksumValidationResult {
  errors: string[]
  valid: boolean
}

export interface SchemaValidationResult {
  errors: string[]
  events: AuditEvent[]
  upcasted: number
  valid: boolean
}

export interface ReplayCheckpoint {
  checkpoint_id: number
  end_event_id: number
  end_ts: string
  size: number
  start_event_id: number
  start_ts: string
}

export function appendAuditEvent(eventsPath: string, input: AppendEventInput): AuditEvent {
  ensureParentDir(eventsPath)
  const events = readEventsStrict(eventsPath)
  const lastEvent = events.at(-1)
  const eventId = (lastEvent?.event_id ?? 0) + 1
  const prevChecksum = lastEvent?.checksum ?? null
  const ts = input.ts ?? new Date().toISOString()

  const baseEvent: Omit<AuditEvent, 'checksum'> = {
    actor: input.actor,
    context_ref: input.contextRef ?? null,
    decision: input.decision ?? null,
    event: input.event,
    event_id: eventId,
    intent_id: input.intentId ?? null,
    metadata: input.metadata ?? {},
    prev_checksum: prevChecksum,
    reason: input.reason ?? null,
    schema_version: CURRENT_SCHEMA_VERSION,
    session_id: input.sessionId ?? null,
    stage: input.stage,
    ts,
  }

  const checksum = hash(`${prevChecksum ?? ''}${canonicalize(baseEvent)}`)
  const event: AuditEvent = {
    ...baseEvent,
    checksum,
  }

  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`)
  return event
}

export function buildReplayCheckpoints(
  events: AuditEvent[],
  checkpointSize: number,
): ReplayCheckpoint[] {
  if (checkpointSize <= 0) {
    throw new Error('checkpointSize must be > 0')
  }

  const checkpoints: ReplayCheckpoint[] = []
  for (let index = 0; index < events.length; index += checkpointSize) {
    const segment = events.slice(index, index + checkpointSize)
    const first = segment[0]
    const last = segment.at(-1)
    if (!last || !first) {
      continue
    }

    checkpoints.push({
      checkpoint_id: checkpoints.length + 1,
      end_event_id: last.event_id,
      end_ts: last.ts,
      size: segment.length,
      start_event_id: first.event_id,
      start_ts: first.ts,
    })
  }

  return checkpoints
}

export function readEventsStrict(eventsPath: string): AuditEvent[] {
  if (!fs.existsSync(eventsPath)) {
    return []
  }

  const lines = fs
    .readFileSync(eventsPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const events = lines.map((line, index) => parseEventLine(line, index + 1))
  events.sort((left, right) => left.event_id - right.event_id)
  return events
}

export function selectReplayEvents(
  events: AuditEvent[],
  limit: number,
  startEventId?: number,
): AuditEvent[] {
  const start = startEventId ? events.filter((event) => event.event_id >= startEventId) : events
  if (limit <= 0) {
    return start
  }

  return start.slice(-limit)
}

export function validateChecksumChain(events: AuditEvent[]): ChecksumValidationResult {
  const errors: string[] = []

  let expectedEventId = 1
  let previousChecksum: null | string = null

  for (const event of events) {
    if (event.event_id !== expectedEventId) {
      errors.push(
        `event_id 序列错误: 期望 ${expectedEventId}, 实际 ${event.event_id} (ts=${event.ts})`,
      )
    }

    if (event.prev_checksum !== previousChecksum) {
      errors.push(
        `prev_checksum 不匹配: event_id=${event.event_id}, 期望 ${previousChecksum ?? 'null'}, 实际 ${event.prev_checksum ?? 'null'}`,
      )
    }

    const baseEvent = stripChecksum(event)
    const expectedChecksum = hash(`${event.prev_checksum ?? ''}${canonicalize(baseEvent)}`)
    if (event.checksum !== expectedChecksum) {
      errors.push(
        `checksum 校验失败: event_id=${event.event_id}, 期望 ${expectedChecksum}, 实际 ${event.checksum}`,
      )
    }

    previousChecksum = event.checksum
    expectedEventId += 1
  }

  return {errors, valid: errors.length === 0}
}

export function validateSchemaCompatibility(events: AuditEvent[]): SchemaValidationResult {
  const errors: string[] = []
  let upcasted = 0

  const normalizedEvents = events.map((event) => {
    if (!event.schema_version) {
      upcasted += 1
      return {
        ...event,
        schema_version: CURRENT_SCHEMA_VERSION,
      }
    }

    return event
  })

  for (const event of normalizedEvents) {
    if (event.schema_version !== CURRENT_SCHEMA_VERSION) {
      errors.push(
        `schema_version 不兼容: event_id=${event.event_id}, 期望 ${CURRENT_SCHEMA_VERSION}, 实际 ${event.schema_version}`,
      )
    }
  }

  return {
    errors,
    events: normalizedEvents,
    upcasted,
    valid: errors.length === 0,
  }
}

export function verifySnapshotAnchor(
  events: AuditEvent[],
  state: {lastEventChecksum?: null | string; lastEventId?: null | number},
): null | string {
  if (events.length === 0) {
    if (
      (state.lastEventId === null || state.lastEventId === undefined) &&
      (state.lastEventChecksum === null || state.lastEventChecksum === undefined)
    ) {
      return null
    }

    return 'snapshot anchor 与事件日志不一致: 事件为空但 state 存在 anchor'
  }

  if (
    state.lastEventId === null ||
    state.lastEventId === undefined ||
    state.lastEventChecksum === null ||
    state.lastEventChecksum === undefined
  ) {
    return 'snapshot anchor 缺失: state.lastEventId 或 state.lastEventChecksum 为空'
  }

  const lastEvent = events.at(-1)
  if (!lastEvent) {
    return '事件日志读取失败: 无法定位末尾事件'
  }

  if (state.lastEventId !== lastEvent.event_id) {
    return `snapshot anchor event_id 不匹配: state=${state.lastEventId}, events=${lastEvent.event_id}`
  }

  if (state.lastEventChecksum !== lastEvent.checksum) {
    return `snapshot anchor checksum 不匹配: state=${state.lastEventChecksum}, events=${lastEvent.checksum}`
  }

  return null
}

function canonicalize(value: JsonValue | Record<string, unknown>): string {
  return JSON.stringify(sortJson(value as JsonValue))
}

function ensureParentDir(targetPath: string): void {
  const parent = targetPath.split('/').slice(0, -1).join('/')
  if (parent && !fs.existsSync(parent)) {
    fs.mkdirSync(parent, {recursive: true})
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function stripChecksum(event: AuditEvent): Omit<AuditEvent, 'checksum'> {
  return {
    actor: event.actor,
    context_ref: event.context_ref,
    decision: event.decision,
    event: event.event,
    event_id: event.event_id,
    intent_id: event.intent_id,
    metadata: event.metadata,
    prev_checksum: event.prev_checksum,
    reason: event.reason,
    schema_version: event.schema_version,
    session_id: event.session_id,
    stage: event.stage,
    ts: event.ts,
  }
}

function isPlainObject(value: JsonValue): value is {[key: string]: JsonValue} {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEventLine(line: string, lineNo: number): AuditEvent {
  let raw: unknown
  try {
    raw = JSON.parse(line)
  } catch {
    throw new Error(`events.jsonl 第 ${lineNo} 行不是合法 JSON`)
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`events.jsonl 第 ${lineNo} 行必须是对象`)
  }

  const record = raw as Partial<AuditEvent>
  const event: AuditEvent = {
    actor: toStringField(record.actor, lineNo, 'actor'),
    checksum: toStringField(record.checksum, lineNo, 'checksum'),
    context_ref: toNullableStringField(record.context_ref, lineNo, 'context_ref'),
    decision: toNullableStringField(record.decision, lineNo, 'decision'),
    event: toAuditEventTypeField(record.event, lineNo),
    event_id: toNumberField(record.event_id, lineNo, 'event_id'),
    intent_id: toNullableStringField(record.intent_id, lineNo, 'intent_id'),
    metadata: toMetadataField(record.metadata, lineNo),
    prev_checksum: toNullableStringField(record.prev_checksum, lineNo, 'prev_checksum'),
    reason: toNullableStringField(record.reason, lineNo, 'reason'),
    schema_version: toStringField(record.schema_version, lineNo, 'schema_version'),
    session_id: toNullableStringField(record.session_id, lineNo, 'session_id'),
    stage: toStringField(record.stage, lineNo, 'stage'),
    ts: toStringField(record.ts, lineNo, 'ts'),
  }

  return event
}

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item))
  }

  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort()
    const sortedObject: {[key: string]: JsonValue} = {}
    for (const key of sortedKeys) {
      sortedObject[key] = sortJson(value[key])
    }

    return sortedObject
  }

  return value
}

function toMetadataField(
  value: AuditEvent['metadata'] | undefined,
  lineNo: number,
): Record<string, JsonValue> {
  if (!value) {
    return {}
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`events.jsonl 第 ${lineNo} 行字段 metadata 必须是对象`)
  }

  return value
}

function toNullableStringField(
  value: null | string | undefined,
  lineNo: number,
  fieldName: string,
): null | string {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new TypeError(`events.jsonl 第 ${lineNo} 行字段 ${fieldName} 必须是字符串或 null`)
  }

  return value
}

function toNumberField(value: number | undefined, lineNo: number, fieldName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`events.jsonl 第 ${lineNo} 行字段 ${fieldName} 必须是数字`)
  }

  return value
}

function toStringField(value: string | undefined, lineNo: number, fieldName: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`events.jsonl 第 ${lineNo} 行字段 ${fieldName} 必须是非空字符串`)
  }

  return value
}

function toAuditEventTypeField(value: string | undefined, lineNo: number): AuditEventType {
  const event = toStringField(value, lineNo, 'event')
  if (!AUDIT_EVENT_TYPES.includes(event as AuditEventType)) {
    throw new Error(
      `events.jsonl 第 ${lineNo} 行字段 event 不合法: ${event}，可用值: ${AUDIT_EVENT_TYPES.join(', ')}`,
    )
  }

  return event as AuditEventType
}
