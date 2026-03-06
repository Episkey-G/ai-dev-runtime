/**
 * 统一输出工具
 * 根据 --json 标志决定输出格式（人类可读 vs JSON envelope）。
 */

import type {Command} from '@oclif/core'

import type {Envelope} from './envelope.js'

/** 输出 JSON envelope 到 stdout */
export function outputJson(envelope: Envelope): void {
  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n')
}

/** 根据 flags 决定输出方式 */
export function outputResult(
  command: Command,
  envelope: Envelope,
  flags: {json?: boolean},
): void {
  if (flags.json) {
    outputJson(envelope)
    return
  }

  if (envelope.ok) {
    command.log(typeof envelope.data === 'string' ? envelope.data : JSON.stringify(envelope.data, null, 2))
  } else {
    command.error(`[${envelope.error.code}] ${envelope.error.message}`)
  }
}
