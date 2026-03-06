/**
 * CLI 命令面集成测试
 *
 * 注意：未使用 @oclif/test 的 runCommand，因为 oclif 在 vitest + ESM 环境中
 * 进程内加载命令时无法解析 .ts 文件中的 .js 扩展名导入。
 * 使用 bin/dev.js（ts-node/esm loader）通过子进程执行，确保测试可靠性。
 */
import {execSync} from 'node:child_process'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/dev.js')

/** 运行 CLI 命令并返回 stdout + exitCode */
function runCli(args: string): {exitCode: number; stdout: string} {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {...process.env, NODE_NO_WARNINGS: '1'},
    })
    return {exitCode: 0, stdout}
  } catch (error: unknown) {
    const err = error as {status?: number; stdout?: string}
    return {exitCode: err.status ?? 1, stdout: err.stdout ?? ''}
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

  describe('version 命令', () => {
    it('version --json 应返回 envelope 格式版本信息', () => {
      const {stdout} = runCli('version --json')
      const envelope = JSON.parse(stdout)
      expect(envelope.ok).toBe(true)
      expect(envelope.data).toHaveProperty('version')
      expect(envelope.data).toHaveProperty('node')
      expect(envelope.data).toHaveProperty('platform')
      expect(envelope.meta).toHaveProperty('version')
      expect(envelope.meta).toHaveProperty('timestamp')
    })
  })
})
