import type {Stage} from '../lib/stage-engine.js'
import type {AgentAdapter, AgentId} from './types.js'

import {ErrorCodes} from '../cli/error-codes.js'

export const STAGE_AGENT_DEFAULTS: Partial<Record<Stage, AgentId>> = {
  EXECUTE: 'claude',
  IMPLEMENT: 'claude',
  PLAN: 'codex',
  RECOVER: 'claude',
  RESEARCH: 'codex',
  REVIEW: 'codex',
}

export interface ResolveAgentInput {
  overrideAgentId?: string
  stage: string
}

export function resolveAgentForStage(input: ResolveAgentInput): AgentId {
  const {overrideAgentId, stage} = input

  if (overrideAgentId && isAgentId(overrideAgentId)) {
    return overrideAgentId
  }

  return STAGE_AGENT_DEFAULTS[stage as Stage] ?? 'claude'
}

export class AdapterRouter {
  constructor(private readonly adapters: Record<AgentId, AgentAdapter>) {}

  route(stage: string, overrideAgentId?: string): AgentAdapter {
    const agentId = resolveAgentForStage({overrideAgentId, stage})
    const adapter = this.adapters[agentId]

    if (!adapter) {
      throw new Error(ErrorCodes.CONNECTOR_INVOCATION_FAILED)
    }

    return adapter
  }
}

function isAgentId(agentId: string): agentId is AgentId {
  return agentId === 'claude' || agentId === 'codex'
}
