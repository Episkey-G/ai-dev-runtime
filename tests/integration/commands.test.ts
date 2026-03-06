import {describe, expect, it} from 'vitest'
import {execSync} from 'node:child_process'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/dev.js')

/** 运行 CLI 命令并返回 stdout + exitCode */
function runCli(args: string): {stdout: string; exitCode: number} {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      env: {...process.env, NODE_NO_WARNINGS: '1'},
    })
    return {stdout, exitCode: 0}
  } catch (error: unknown) {
    const err = error as {stdout?: string; status?: number}
    return {stdout: err.stdout ?? '', exitCode: err.status ?? 1}
  }
}

describe('CLI 命令面集成测试', () => {
  const REQUIRED_COMMANDS = ['init', 'next', 'handoff', 'approve', 'reject', 'other', 'resume', 'replay']

  describe('--help', () => {
    it('应返回退出码 0', () => {
      const {exitCode} = runCli('--help')
      expect(exitCode).toBe(0)
    })

    it('应包含全部 8 个目标命令', () => {
      const {stdout} = runCli('--help')
      for (const cmd of REQUIRED_COMMANDS) {
        expect(stdout).toContain(cmd)
      }
    })
  })

  describe('--version', () => {
    it('应返回退出码 0', () => {
      const {exitCode} = runCli('--version')
      expect(exitCode).toBe(0)
    })

    it('应输出语义化版本号', () => {
      const {stdout} = runCli('--version')
      // 格式: ai-dev-runtime/0.1.0 platform node-vXX
      expect(stdout).toMatch(/ai-dev-runtime\/\d+\.\d+\.\d+/)
    })
  })

  describe('各命令退出码', () => {
    for (const cmd of REQUIRED_COMMANDS) {
      it(`${cmd} 命令应返回退出码 0`, () => {
        const {exitCode} = runCli(cmd)
        expect(exitCode).toBe(0)
      })
    }
  })

  describe('--json envelope 输出', () => {
    for (const cmd of REQUIRED_COMMANDS) {
      it(`${cmd} --json 应返回有效的 JSON envelope`, () => {
        const {stdout} = runCli(`${cmd} --json`)
        const envelope = JSON.parse(stdout)
        expect(envelope).toHaveProperty('ok', true)
        expect(envelope).toHaveProperty('data')
        expect(envelope).toHaveProperty('meta')
        expect(envelope.meta).toHaveProperty('version')
        expect(envelope.meta).toHaveProperty('timestamp')
      })
    }
  })
})
