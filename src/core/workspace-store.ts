import fs from 'node:fs'
import path from 'node:path'

export interface RuntimeState {
  createdAt: string
  executor?: string
  gateDecisions?: Array<{
    decision: 'approve' | 'other' | 'reject'
    direction?: string
    policyName?: string
    reason?: string
    stage: string
    timestamp: string
  }>
  lastEventChecksum?: null | string
  lastEventId?: null | number
  lastTransition: null | {
    from: string
    reason: string
    timestamp: string
    to: string
  }
  sessionId: null | string
  stage: string
  updatedAt?: string
}

export interface WorkspacePaths {
  aiDevPath: string
  configPath: string
  contextPath: string
  eventsPath: string
  lockPath: string
  statePath: string
}

export function resolveWorkspacePaths(workspacePath: string): WorkspacePaths {
  const aiDevPath = path.join(workspacePath, '.ai-dev')

  return {
    aiDevPath,
    configPath: path.join(aiDevPath, 'config.json'),
    contextPath: path.join(aiDevPath, 'context'),
    eventsPath: path.join(aiDevPath, 'events', 'events.jsonl'),
    lockPath: path.join(aiDevPath, '.lock'),
    statePath: path.join(aiDevPath, 'snapshots', 'state.json'),
  }
}

export function isWorkspaceInitialized(workspacePath: string): boolean {
  const paths = resolveWorkspacePaths(workspacePath)
  return fs.existsSync(paths.aiDevPath)
}

export function loadRuntimeState(workspacePath: string): null | RuntimeState {
  const {statePath} = resolveWorkspacePaths(workspacePath)
  if (!fs.existsSync(statePath)) {
    return null
  }

  const raw = fs.readFileSync(statePath, 'utf8')
  return JSON.parse(raw) as RuntimeState
}

export function saveRuntimeState(workspacePath: string, state: RuntimeState): void {
  const {statePath} = resolveWorkspacePaths(workspacePath)
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

export function loadWorkspaceConfig(workspacePath: string): Record<string, unknown> {
  const {configPath} = resolveWorkspacePaths(workspacePath)
  if (!fs.existsSync(configPath)) {
    throw new Error('CFG_FILE_NOT_FOUND')
  }

  const raw = fs.readFileSync(configPath, 'utf8')
  return JSON.parse(raw) as Record<string, unknown>
}

export function saveWorkspaceConfig(workspacePath: string, config: Record<string, unknown>): void {
  const {configPath} = resolveWorkspacePaths(workspacePath)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export function createInitialRuntimeState(): RuntimeState {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    executor: 'claude',
    lastEventChecksum: null,
    lastEventId: null,
    lastTransition: null,
    sessionId: null,
    stage: 'IDLE',
    updatedAt: now,
  }
}
