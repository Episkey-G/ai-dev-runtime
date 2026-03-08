import type {RuntimeState} from './workspace-store.js'

export const GATE_STAGES = new Set(['PLAN', 'RESEARCH', 'REVIEW'])
export const DEFAULT_GATE_POLICY_NAME = 'default'

export type GateDecision = 'approve' | 'other' | 'reject'

export interface GatePolicy {
  description: string
  name: string
  requiredStages: string[]
}

export const DEFAULT_GATE_POLICIES: GatePolicy[] = [
  {
    description: '通用 Gate 策略，允许在所有 Gate 阶段使用',
    name: 'default',
    requiredStages: ['PLAN', 'RESEARCH', 'REVIEW'],
  },
  {
    description: 'PRD 冻结策略，要求在规划阶段完成关键确认',
    name: 'prd_freeze',
    requiredStages: ['PLAN'],
  },
  {
    description: 'PRD 评审策略，强调评审阶段的审批决策',
    name: 'prd_review',
    requiredStages: ['REVIEW'],
  },
  {
    description: '紧急修复策略，用于快速变更审批',
    name: 'hotfix',
    requiredStages: ['REVIEW'],
  },
]

export const GATE_POLICY_NAMES = DEFAULT_GATE_POLICIES.map((policy) => policy.name)

interface ApplyGateDecisionInput {
  decision: GateDecision
  direction?: string
  policyName?: string
  reason?: string
  state: RuntimeState
}

export interface ApplyGateDecisionResult {
  nextStage: null | string
  policyName: string
  state: RuntimeState
}

export function applyGateDecision(input: ApplyGateDecisionInput): ApplyGateDecisionResult {
  const {decision, direction, reason} = input
  const policyName = normalizePolicyName(input.policyName)
  const state = structuredClone(input.state)
  const currentStage = state.stage

  if (!GATE_STAGES.has(currentStage)) {
    return {
      nextStage: null,
      policyName,
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
    policyName,
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
    policyName,
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

function normalizePolicyName(policyName?: string): string {
  const normalized = policyName?.trim()
  if (!normalized) {
    return DEFAULT_GATE_POLICY_NAME
  }

  return normalized
}
