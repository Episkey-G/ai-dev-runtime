import {execSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path, {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/dev.js')

interface CliResult {
  exitCode: number
  stderr: string
  stdout: string
}

interface JsonEnvelope {
  data?: Record<string, unknown>
  error?: Record<string, unknown>
  meta: {
    timestamp: string
    version: string
  }
  ok: boolean
}

function createWorkspaceDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-json-contract-'))
}

function runCli(args: string): CliResult {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {...process.env, NODE_NO_WARNINGS: '1'},
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

function parseEnvelope(output: string): JsonEnvelope {
  return JSON.parse(output) as JsonEnvelope
}

function assertMeta(meta: JsonEnvelope['meta']): void {
  expect(typeof meta.timestamp).toBe('string')
  expect(Number.isNaN(Date.parse(meta.timestamp))).toBe(false)
  expect(typeof meta.version).toBe('string')
  expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/)
}

function assertSuccessEnvelope(envelope: JsonEnvelope): void {
  expect(typeof envelope.ok).toBe('boolean')
  expect(envelope.ok).toBe(true)
  expect(envelope.data).toBeDefined()
  expect(envelope.error).toBeUndefined()
  assertMeta(envelope.meta)
}

function assertFailureEnvelope(envelope: JsonEnvelope): void {
  expect(typeof envelope.ok).toBe('boolean')
  expect(envelope.ok).toBe(false)
  expect(envelope.error).toBeDefined()
  expect(envelope.data).toBeUndefined()
  assertMeta(envelope.meta)
}

describe('JSON contract tests', () => {
  const workspaces: string[] = []

  afterEach(() => {
    for (const dir of workspaces.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('init --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    const successResult = runCli(`init --json --workspace-path ${workspace}`)
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const failureResult = runCli('init --json --workspace-path "~"')
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })

  it('next --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const successResult = runCli(`next --json --workspace-path ${workspace}`)
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const missingWorkspace = createWorkspaceDir()
    workspaces.push(missingWorkspace)
    const failureResult = runCli(`next --json --workspace-path ${missingWorkspace}`)
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })

  it('handoff --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const successResult = runCli(`handoff --json --workspace-path ${workspace} --to codex`)
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const failureResult = runCli(`handoff --json --workspace-path ${workspace} --to invalid-agent`)
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })

  it('approve --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const successResult = runCli(`approve --json --workspace-path ${workspace}`)
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const missingWorkspace = createWorkspaceDir()
    workspaces.push(missingWorkspace)
    const failureResult = runCli(`approve --json --workspace-path ${missingWorkspace}`)
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })

  it('reject --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const successResult = runCli(
      `reject --json --workspace-path ${workspace} --reason "contract test reject"`,
    )
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const missingWorkspace = createWorkspaceDir()
    workspaces.push(missingWorkspace)
    const failureResult = runCli(
      `reject --json --workspace-path ${missingWorkspace} --reason "contract test reject"`,
    )
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })

  it('other --json success and failure envelope contract', () => {
    const workspace = createWorkspaceDir()
    workspaces.push(workspace)

    expect(runCli(`init --json --workspace-path ${workspace}`).exitCode).toBe(0)
    expect(runCli(`next --json --workspace-path ${workspace}`).exitCode).toBe(0)
    const successResult = runCli(
      `other --json --workspace-path ${workspace} --direction "contract test direction"`,
    )
    expect(successResult.exitCode).toBe(0)
    assertSuccessEnvelope(parseEnvelope(successResult.stdout))

    const missingWorkspace = createWorkspaceDir()
    workspaces.push(missingWorkspace)
    const failureResult = runCli(
      `other --json --workspace-path ${missingWorkspace} --direction "contract test direction"`,
    )
    expect(failureResult.exitCode).toBe(0)
    assertFailureEnvelope(parseEnvelope(failureResult.stdout))
  })
})
