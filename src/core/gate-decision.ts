import type {RuntimeState} from './workspace-store.js'

export const GATE_STAGES = new Set(['PLAN', 'RESEARCH', 'REVIEW'])

export type GateDecision = 'approve' | 'other' | 'reject'

interface ApplyGateDecisionInput {
  decision: GateDecision
  direction?: string
  reason?: string
  state: RuntimeState
}

export interface ApplyGateDecisionResult {
  nextStage: null | string
  state: RuntimeState
}

export function applyGateDecision(input: ApplyGateDecisionInput): ApplyGateDecisionResult {
  const {decision, direction, reason} = input
  const state = structuredClone(input.state)
  const currentStage = state.stage

  if (!GATE_STAGES.has(currentStage)) {
    return {
      nextStage: null,
      state,
    }
  }

  if (decision === 'reject' && (!reason || reason.trim().length === 0)) {
    throw new Error('REJECT_REASON_REQUIRED')
  }

  if (decision === 'other' && (!direction || direction.trim().length === 0)) {
    throw new Error('OTHER_DIRECTION_REQUIRED')
  }

  const timestamp = new Date().toISOString()
  const nextStage = resolveNextStage(currentStage, decision)
  const reasonText = reason ?? direction ?? `Gate ${decision}`

  if (!state.gateDecisions) {
    state.gateDecisions = []
  }

  state.gateDecisions.push({
    decision,
    direction: direction?.trim() || undefined,
    reason: reason?.trim() || undefined,
    stage: currentStage,
    timestamp,
  })

  if (nextStage) {
    state.lastTransition = {
      from: currentStage,
      reason: reasonText,
      timestamp,
      to: nextStage,
    }
    state.stage = nextStage
  }

  state.updatedAt = timestamp

  return {
    nextStage,
    state,
  }
}

function resolveNextStage(stage: string, decision: GateDecision): null | string {
  if (decision === 'other') {
    return null
  }

  const approveMap: Record<string, string> = {
    PLAN: 'IMPLEMENT',
    RESEARCH: 'PLAN',
    REVIEW: 'EXECUTE',
  }

  const rejectMap: Record<string, string> = {
    PLAN: 'RESEARCH',
    RESEARCH: 'IDLE',
    REVIEW: 'IMPLEMENT',
  }

  if (decision === 'approve') {
    return approveMap[stage] ?? null
  }

  return rejectMap[stage] ?? null
}
