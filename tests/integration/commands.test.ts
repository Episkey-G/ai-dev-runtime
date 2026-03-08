/* eslint-disable camelcase */

import {execSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path, {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

import {appendAuditEvent} from '../../src/core/event-log.js'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/dev.js')
const REQUIRED_COMMANDS = ['init', 'next', 'handoff', 'approve', 'reject', 'other', 'resume', 'replay']

function createWorkspaceDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-int-'))
}

function runCli(
  args: string,
  options: {
    env?: NodeJS.ProcessEnv
  } = {},
): {exitCode: number; stderr: string; stdout: string} {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {...process.env, NODE_NO_WARNINGS: '1', ...options.env},
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return {exitCode: 0, stderr: '', stdout}
  } catch (error_) {
    const error = error_ as {status?: number; stderr?: string; stdout?: string}
    return {
      exitCode: error.status ?? 1,
      stderr: error.stderr ?? '',
      stdout: error.stdout ?? '',
    }
  }
}

describe('CLI 命令面集成测试', () => {
  const workspaces: string[] = []

  afterEach(() => {
    for (const dir of workspaces.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('--help 应返回退出码 0 且包含目标命令', () => {
    const {exitCode, stdout} = runCli('--help')
    expect(exitCode).toBe(0)
    for (const command of REQUIRED_COMMANDS) {
      expect(stdout).toContain(command)
    }
  })

  it('--version 应返回语义化版本', () => {
    const {exitCode, stdout} = runCli('--version')
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/ai-dev-runtime\/\d+\.\d+\.\d+/)
  })

  it('next 首次运行应写入 workspace_initialized 与 stage_transition 事件', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const next = runCli(`next --json --workspace-path ${workspace}`)
    expect(next.exitCode).toBe(0)
    const nextEnvelope = JSON.parse(next.stdout)
    expect(nextEnvelope.ok).toBe(true)
    expect(nextEnvelope.data.suggestion.currentStage).toBe('RESEARCH')

    const eventsPath = path.join(workspace, '.ai-dev', 'events', 'events.jsonl')
    const events = fs
      .readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))

    expect(events.length).toBeGreaterThanOrEqual(2)
    expect(events[0].event).toBe('workspace_initialized')
    expect(events[1].event).toBe('stage_transition')
    expect(events[0]).toHaveProperty('schema_version')
    expect(events[0]).toHaveProperty('checksum')
  })

  it('config show 应按 CLI > ENV > file 解析并标注来源', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)

    const envOnly = runCli(`config:show --json --workspace-path ${workspace}`, {
      env: {
        AIDEV_DEEP_ANALYZER: 'claude',
        AIDEV_EXECUTOR: 'codex',
      },
    })
    expect(envOnly.exitCode).toBe(0)
    const envEnvelope = JSON.parse(envOnly.stdout)
    expect(envEnvelope.data.defaults.executor).toBe('codex')
    expect(envEnvelope.data._meta.resolved_sources['defaults.executor']).toBe('env')

    const withFlag = runCli(`config:show --json --workspace-path ${workspace} --executor claude`, {
      env: {
        AIDEV_EXECUTOR: 'codex',
      },
    })
    expect(withFlag.exitCode).toBe(0)
    const flagEnvelope = JSON.parse(withFlag.stdout)
    expect(flagEnvelope.data.defaults.executor).toBe('claude')
    expect(flagEnvelope.data._meta.resolved_sources['defaults.executor']).toBe('flag')
  })

  it('reject/other 命令应执行语义化 Gate 决策', () => {
    const rejectWorkspace = createWorkspaceDir()
    workspaces.push(rejectWorkspace)
    expect(runCli(`init --json --workspace-path ${rejectWorkspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${rejectWorkspace}`).exitCode).toBe(0)

    const reject = runCli(`reject --json --workspace-path ${rejectWorkspace} --reason "needs revision"`)
    expect(reject.exitCode).toBe(0)
    const rejectEnvelope = JSON.parse(reject.stdout)
    expect(rejectEnvelope.ok).toBe(true)
    expect(rejectEnvelope.data.action).toBe('rejected')
    expect(rejectEnvelope.data.reason).toBe('needs revision')

    const otherWorkspace = createWorkspaceDir()
    workspaces.push(otherWorkspace)
    expect(runCli(`init --json --workspace-path ${otherWorkspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${otherWorkspace}`).exitCode).toBe(0)

    const other = runCli(`other --json --workspace-path ${otherWorkspace} --direction "split rollout"`)
    expect(other.exitCode).toBe(0)
    const otherEnvelope = JSON.parse(other.stdout)
    expect(otherEnvelope.ok).toBe(true)
    expect(otherEnvelope.data.action).toBe('other')
    expect(otherEnvelope.data.direction).toBe('split rollout')
  }, 30_000)

  it('handoff 应写入 agent_handoff 审计事件并携带 intent_id/schema_version', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const handoff = runCli(`handoff --json --workspace-path ${workspace} --to codex`)
    expect(handoff.exitCode).toBe(0)

    const handoffEnvelope = JSON.parse(handoff.stdout)
    expect(handoffEnvelope.ok).toBe(true)
    expect(handoffEnvelope.data.context_packet).toHaveProperty('intent_id')
    expect(handoffEnvelope.data.context_packet).toHaveProperty('schema_version')

    const eventsPath = path.join(workspace, '.ai-dev', 'events', 'events.jsonl')
    const events = fs
      .readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))

    const handoffEvent = events.find((event) => event.event === 'agent_handoff')
    expect(handoffEvent).toBeDefined()
    expect(handoffEvent).toHaveProperty('intent_id')
    expect(handoffEvent).toHaveProperty('schema_version')
  })

  it('resume 应执行 preflight 三重校验并成功返回', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)

    const resume = runCli(`resume --json --workspace-path ${workspace}`)
    expect(resume.exitCode).toBe(0)
    const envelope = JSON.parse(resume.stdout)
    expect(envelope.ok).toBe(true)
    expect(envelope.data.preflight.checksum_chain).toBe('passed')
    expect(envelope.data.preflight.snapshot_anchor).toBe('passed')
    expect(envelope.data.preflight.schema_compatibility).toBe('passed')
  })

  it('resume 应检测未完成的 agent_intent 并切换到 RECOVER', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)

    const statePath = path.join(workspace, '.ai-dev', 'snapshots', 'state.json')
    const eventsPath = path.join(workspace, '.ai-dev', 'events', 'events.jsonl')
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as {
      lastEventChecksum: null | string
      lastEventId: null | number
      sessionId: string
      stage: string
    }

    const pendingEvent = appendAuditEvent(eventsPath, {
      actor: 'system',
      event: 'agent_intent',
      intentId: 'intent_crash_pending',
      metadata: {
        agent_id: 'claude',
        schema_version: '1.0.0',
        task: 'simulate crash',
        timestamp: new Date().toISOString(),
      },
      reason: '模拟调用前 checkpoint',
      sessionId: state.sessionId,
      stage: state.stage,
    })

    state.lastEventId = pendingEvent.event_id
    state.lastEventChecksum = pendingEvent.checksum
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2))

    const resume = runCli(`resume --json --workspace-path ${workspace}`)
    expect(resume.exitCode).toBe(0)
    const envelope = JSON.parse(resume.stdout)
    expect(envelope.ok).toBe(true)
    expect(envelope.data.stage).toBe('RECOVER')
    expect(envelope.data.recoveryState.detected).toBe(true)
    expect(envelope.data.recoveryState.pendingIntent.intentId).toBe('intent_crash_pending')
  })

  it('replay 遇到损坏事件行应 hard-stop', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    fs.appendFileSync(path.join(workspace, '.ai-dev', 'events', 'events.jsonl'), 'not-json-line\n')

    const replay = runCli(`replay --json --workspace-path ${workspace}`)
    expect(replay.exitCode).toBe(0)
    const envelope = JSON.parse(replay.stdout)
    expect(envelope.ok).toBe(false)
    expect(envelope.error.code).toBe('EVT_EVENT_CORRUPT')
  })
})
