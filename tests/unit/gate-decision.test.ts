import {describe, expect, it} from 'vitest'

import type {RuntimeState} from '../../src/core/workspace-store.js'

import {
  applyGateDecision,
  DEFAULT_GATE_POLICIES,
  DEFAULT_GATE_POLICY_NAME,
} from '../../src/core/gate-decision.js'

function createState(stage: string): RuntimeState {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    lastTransition: null,
    sessionId: 'sess_1',
    stage,
  }
}

describe('gate-decision', () => {
  it('默认 Gate 策略应包含 story 要求的策略名称', () => {
    expect(DEFAULT_GATE_POLICIES.map((policy) => policy.name)).toEqual([
      'default',
      'prd_freeze',
      'prd_review',
      'hotfix',
    ])
  })

  it('未指定 policyName 时应回退到 default', () => {
    const {policyName, state} = applyGateDecision({
      decision: 'approve',
      reason: 'ok',
      state: createState('PLAN'),
    })

    expect(policyName).toBe(DEFAULT_GATE_POLICY_NAME)
    expect(state.gateDecisions?.[0]?.policyName).toBe(DEFAULT_GATE_POLICY_NAME)
  })

  it('应记录传入的 policyName', () => {
    const {policyName, state} = applyGateDecision({
      decision: 'other',
      direction: 'do-split-rollout',
      policyName: 'hotfix',
      state: createState('REVIEW'),
    })

    expect(policyName).toBe('hotfix')
    expect(state.gateDecisions?.[0]?.policyName).toBe('hotfix')
  })
})
