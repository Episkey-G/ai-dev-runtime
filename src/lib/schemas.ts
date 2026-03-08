/* eslint-disable camelcase */

import {z} from 'zod'

import type {ContextPacket} from '../adapters/index.js'
import type {RuntimeState} from '../core/workspace-store.js'

const GateDecisionSchema = z
  .object({
    decision: z.enum(['approve', 'other', 'reject']),
    direction: z.string().min(1).optional(),
    policyName: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
    stage: z.string().min(1),
    timestamp: z.string().datetime({offset: true}),
  })
  .strict()

const TransitionSchema = z
  .object({
    from: z.string().min(1),
    reason: z.string().min(1),
    timestamp: z.string().datetime({offset: true}),
    to: z.string().min(1),
  })
  .strict()

export const RuntimeStateSchema: z.ZodType<RuntimeState> = z
  .object({
    createdAt: z.string().datetime({offset: true}),
    executor: z.string().min(1).optional(),
    gateDecisions: z.array(GateDecisionSchema).optional(),
    lastEventChecksum: z.string().min(1).nullable().optional(),
    lastEventId: z.number().int().positive().nullable().optional(),
    lastTransition: TransitionSchema.nullable(),
    sessionId: z.string().min(1).nullable(),
    stage: z.string().min(1),
    updatedAt: z.string().datetime({offset: true}).optional(),
  })
  .strict()

export const ContextPacketSchema: z.ZodType<ContextPacket> = z
  .object({
    context: z
      .object({
        pending_tasks: z.array(z.string()),
        recent_events: z.array(z.string()),
        state: RuntimeStateSchema,
      })
      .strict(),
    from_agent: z.string().min(1),
    intent_id: z.string().min(1),
    schema_version: z.string().min(1),
    session_id: z.string().min(1),
    stage: z.string().min(1),
    timestamp: z.string().datetime({offset: true}),
    to_agent: z.string().min(1),
  })
  .strict()

export function validateContextPacket(packet: ContextPacket): ContextPacket {
  const result = ContextPacketSchema.safeParse(packet)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
      .join('; ')

    throw new Error(`ContextPacket 校验失败: ${details}`)
  }

  return result.data
}
