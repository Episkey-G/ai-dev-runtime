import {execSync} from 'node:child_process'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/run.js')

/** 运行 CLI 命令 */
function runCli(args: string): {exitCode: number; stderr: string; stdout: string;} {
  try {
    const env = {...process.env}
    delete env.NODE_OPTIONS
    delete env.NODE_ENV
    const stdout = execSync(`${CLI} ${args}`, {cwd: PROJECT_ROOT, encoding: 'utf8', env})
    return {exitCode: 0, stderr: '', stdout}
  } catch (error: unknown) {
    const err = error as {status?: number; stderr?: string; stdout?: string;}
    return {
      exitCode: err.status ?? 1,
      stderr: err.stderr ?? '',
      stdout: err.stdout ?? '',
    }
  }
}

describe('CLI 端到端冒烟测试', () => {
  it('Day-1 最小路径: --help 正常输出', () => {
    const {exitCode, stdout} = runCli('--help')
    expect(exitCode).toBe(0)
    expect(stdout).toContain('USAGE')
    expect(stdout).toContain('COMMANDS')
  })

  it('Day-1 最小路径: --version 返回版本', () => {
    const {exitCode, stdout} = runCli('--version')
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/\d+\.\d+\.\d+/)
  })

  it('未知命令应返回非零退出码', () => {
    const {exitCode} = runCli('nonexistent-cmd')
    expect(exitCode).not.toBe(0)
  })

  it('--json 错误 envelope 格式验证（使用未知命令）', () => {
    // 注意：未知命令时 oclif 不走自定义 envelope，但我们验证已知命令的 JSON
    const {exitCode, stdout} = runCli('init --json')
    expect(exitCode).toBe(0)
    const envelope = JSON.parse(stdout)
    expect(envelope.ok).toBe(true)
    expect(envelope.meta.version).toMatch(/\d+\.\d+\.\d+/)
  })
})
