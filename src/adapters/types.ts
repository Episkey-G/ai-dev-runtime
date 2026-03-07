import type {ErrorCode} from '../cli/error-codes.js'
import type {RuntimeState} from '../core/workspace-store.js'

export interface Agent {
  capabilities: string[]
  id: string
  name: string
  role: 'deepAnalyzer' | 'executor' | 'reviewer'
}

export const AGENTS: Record<string, Agent> = {
  claude: {
    capabilities: ['code-generation', 'refactoring', 'testing'],
    id: 'claude',
    name: 'Claude',
    role: 'executor',
  },
  codex: {
    capabilities: ['code-review', 'analysis', 'architecture'],
    id: 'codex',
    name: 'Codex',
    role: 'deepAnalyzer',
  },
}

export type AgentId = keyof typeof AGENTS

export interface AgentIntent {
  agentId: AgentId
  intentId: string
  sessionId: string
  task: string
  timeoutMs?: number
}

export interface AgentResult {
  error?: {
    code: ErrorCode
    details?: Record<string, unknown>
    message: string
  }
  intentId: string
  output: string
  success: boolean
}

export interface AgentAdapter {
  readonly agentId: AgentId
  execute(intent: AgentIntent): Promise<AgentResult>
}

export interface ContextPacket {
  context: {
    pending_tasks: string[]
    recent_events: string[]
    state: RuntimeState
  }
  from_agent: string
  intent_id: string
  schema_version: string
  session_id: string
  stage: string
  timestamp: string
  to_agent: string
}
