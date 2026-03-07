import {spawn} from 'node:child_process'

import type {AgentAdapter, AgentIntent, AgentResult} from './types.js'

import {ErrorCodes} from '../cli/error-codes.js'
import {
  findCachedAgentOutcome,
  writeAgentCompensation,
  writeAgentIntent,
  writeAgentResult,
} from './event-helpers.js'

const DEFAULT_TIMEOUT_MS = 120_000

export class ClaudeAdapter implements AgentAdapter {
  readonly agentId = 'claude' as const

  async execute(intent: AgentIntent): Promise<AgentResult> {
    const cached = findCachedAgentOutcome(intent)
    if (cached) {
      return cached
    }

    const context = intent.eventsPath && intent.stage ? {eventsPath: intent.eventsPath, stage: intent.stage} : null
    if (context) {
      writeAgentIntent(intent, context)
    }

    const result = await invokeConnector('claude', ['-p', intent.task], intent)
    if (!context) {
      return result
    }

    if (result.success) {
      writeAgentResult(intent, context, result)
      return result
    }

    writeAgentCompensation(intent, context, result)
    return result
  }
}

function invokeConnector(command: string, args: string[], intent: AgentIntent): Promise<AgentResult> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let didTimeout = false
    let settled = false

    const settle = (result: AgentResult): void => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeoutHandle)
      resolve(result)
    }

    const child = spawn(command, args, {stdio: ['ignore', 'pipe', 'pipe']})
    const timeoutMs = intent.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const timeoutHandle = setTimeout(() => {
      didTimeout = true
      child.kill('SIGTERM')
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })

    child.once('error', (error) => {
      const code = (error as NodeJS.ErrnoException).code === 'ENOENT'
        ? ErrorCodes.CONNECTOR_CLI_NOT_FOUND
        : ErrorCodes.CONNECTOR_INVOCATION_FAILED

      settle({
        error: {
          code,
          details: {
            command,
            errno: (error as NodeJS.ErrnoException).code ?? null,
          },
          message: `Claude CLI 调用失败: ${error.message}`,
        },
        intentId: intent.intentId,
        output: '',
        success: false,
      })
    })

    child.once('close', (exitCode, signal) => {
      if (didTimeout) {
        settle({
          error: {
            code: ErrorCodes.CONNECTOR_TIMEOUT,
            details: {command, timeoutMs},
            message: `Claude CLI 执行超时 (${timeoutMs}ms)`,
          },
          intentId: intent.intentId,
          output: '',
          success: false,
        })
        return
      }

      if (exitCode === 0) {
        settle({
          intentId: intent.intentId,
          output: stdout.trim(),
          success: true,
        })
        return
      }

      const code = isAuthFailure(stderr)
        ? ErrorCodes.CONNECTOR_AUTH_FAILED
        : ErrorCodes.CONNECTOR_INVOCATION_FAILED

      settle({
        error: {
          code,
          details: {
            exitCode,
            signal: signal ?? null,
            stderr: stderr.trim(),
          },
          message: `Claude CLI 返回非零退出码: ${exitCode ?? 'null'}`,
        },
        intentId: intent.intentId,
        output: stdout.trim(),
        success: false,
      })
    })
  })
}

function isAuthFailure(stderr: string): boolean {
  return /(auth|authentication|unauthorized|forbidden|login|token|credential)/i.test(stderr)
}
