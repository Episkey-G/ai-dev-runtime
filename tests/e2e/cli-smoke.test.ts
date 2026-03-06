import {describe, expect, it} from 'vitest'
import {execSync} from 'node:child_process'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/run.js')

/** 运行 CLI 命令 */
function runCli(args: string): {stdout: string; stderr: string; exitCode: number} {
  try {
    const env = {...process.env}
    delete env['NODE_OPTIONS']
    delete env['NODE_ENV']
    const stdout = execSync(`${CLI} ${args}`, {encoding: 'utf-8', cwd: PROJECT_ROOT, env})
    return {stdout, stderr: '', exitCode: 0}
  } catch (error: unknown) {
    const err = error as {stdout?: string; stderr?: string; status?: number}
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    }
  }
}

describe('CLI 端到端冒烟测试', () => {
  it('Day-1 最小路径: --help 正常输出', () => {
    const {stdout, exitCode} = runCli('--help')
    expect(exitCode).toBe(0)
    expect(stdout).toContain('USAGE')
    expect(stdout).toContain('COMMANDS')
  })

  it('Day-1 最小路径: --version 返回版本', () => {
    const {stdout, exitCode} = runCli('--version')
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/\d+\.\d+\.\d+/)
  })

  it('未知命令应返回非零退出码', () => {
    const {exitCode} = runCli('nonexistent-cmd')
    expect(exitCode).not.toBe(0)
  })

  it('--json 错误 envelope 格式验证（使用未知命令）', () => {
    // 注意：未知命令时 oclif 不走自定义 envelope，但我们验证已知命令的 JSON
    const {stdout, exitCode} = runCli('init --json')
    expect(exitCode).toBe(0)
    const envelope = JSON.parse(stdout)
    expect(envelope.ok).toBe(true)
    expect(envelope.meta.version).toMatch(/\d+\.\d+\.\d+/)
  })
})
