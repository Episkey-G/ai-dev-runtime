/* eslint-disable camelcase */

import type {AgentIntent, AgentResult} from './types.js'

import {
  appendAuditEvent,
  type AppendEventInput,
  type AuditEvent,
  CURRENT_SCHEMA_VERSION,
  readEventsStrict,
} from '../core/event-log.js'

interface AgentEventContext {
  eventsPath: string
  stage: string
}

function buildBaseEventInput(
  intent: AgentIntent,
  context: AgentEventContext,
  timestamp: string,
): Omit<AppendEventInput, 'event'> {
  return {
    actor: 'system',
    intentId: intent.intentId,
    metadata: {
      agent_id: intent.agentId,
      schema_version: CURRENT_SCHEMA_VERSION,
      task: intent.task,
      timestamp,
    },
    reason: `agent ${intent.agentId} 调用`,
    sessionId: intent.sessionId,
    stage: context.stage,
  }
}

export function findCachedAgentOutcome(intent: AgentIntent): AgentResult | null {
  if (!intent.eventsPath) {
    return null
  }

  const events = readEventsStrict(intent.eventsPath)
  const matched = [...events]
    .reverse()
    .find(
      (event) =>
        event.intent_id === intent.intentId &&
        (event.event === 'agent_result' || event.event === 'agent_compensation'),
    )

  if (!matched) {
    return null
  }

  if (matched.event === 'agent_result') {
    const output = typeof matched.metadata.output === 'string' ? matched.metadata.output : ''
    return {
      intentId: intent.intentId,
      output,
      success: true,
    }
  }

  const code =
    typeof matched.metadata.error_code === 'string' ? matched.metadata.error_code : 'CONNECTOR_INVOCATION_FAILED'
  const message =
    typeof matched.metadata.error_message === 'string' ? matched.metadata.error_message : 'Connector 调用失败'
  const details = parseErrorDetails(matched.metadata.error_details)

  return {
    error: {
      code: code as NonNullable<AgentResult['error']>['code'],
      details: details ?? {},
      message,
    },
    intentId: intent.intentId,
    output: '',
    success: false,
  }
}

function parseErrorDetails(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  if (typeof value !== 'string') {
    return undefined
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined
    }

    return parsed as Record<string, unknown>
  } catch {
    return undefined
  }
}

export function writeAgentIntent(intent: AgentIntent, context: AgentEventContext): void {
  const timestamp = new Date().toISOString()
  appendAuditEvent(context.eventsPath, {
    ...buildBaseEventInput(intent, context, timestamp),
    event: 'agent_intent',
  })
}

export function hasIntentCheckpoint(intent: AgentIntent): boolean {
  if (!intent.eventsPath) {
    return false
  }

  const events = readEventsStrict(intent.eventsPath)
  return events.some((event) => event.event === 'agent_intent' && event.intent_id === intent.intentId)
}

export function writeAgentResult(
  intent: AgentIntent,
  context: AgentEventContext,
  result: AgentResult,
): void {
  const timestamp = new Date().toISOString()
  const base = buildBaseEventInput(intent, context, timestamp)
  appendAuditEvent(context.eventsPath, {
    ...base,
    event: 'agent_result',
    metadata: {
      ...base.metadata,
      output: result.output,
      success: true,
    },
  })
}

export function writeAgentCompensation(
  intent: AgentIntent,
  context: AgentEventContext,
  result: AgentResult,
): void {
  const timestamp = new Date().toISOString()
  const base = buildBaseEventInput(intent, context, timestamp)
  appendAuditEvent(context.eventsPath, {
    ...base,
    event: 'agent_compensation',
    metadata: {
      ...base.metadata,
      error_code: result.error?.code ?? 'CONNECTOR_INVOCATION_FAILED',
      error_details: JSON.stringify(result.error?.details ?? {}),
      error_message: result.error?.message ?? 'Connector 调用失败',
      output: result.output,
      success: false,
    },
  })
}

export interface PendingAgentRecoveryState {
  agentId: string
  intentId: string
  stage: string
  timestamp: string
}

export function findPendingAgentRecoveryState(
  events: AuditEvent[],
  sessionId?: string,
): null | PendingAgentRecoveryState {
  const pending = new Map<string, PendingAgentRecoveryState>()

  for (const event of events) {
    if (sessionId && event.session_id !== sessionId) {
      continue
    }

    if (event.event === 'agent_intent' && event.intent_id) {
      pending.set(event.intent_id, {
        agentId: typeof event.metadata.agent_id === 'string' ? event.metadata.agent_id : 'unknown',
        intentId: event.intent_id,
        stage: event.stage,
        timestamp: event.ts,
      })
      continue
    }

    if ((event.event === 'agent_result' || event.event === 'agent_compensation') && event.intent_id) {
      pending.delete(event.intent_id)
    }
  }

  const unresolved = [...pending.values()]
  if (unresolved.length === 0) {
    return null
  }

  unresolved.sort((left, right) => left.timestamp.localeCompare(right.timestamp))
  return unresolved.at(-1) ?? null
}
