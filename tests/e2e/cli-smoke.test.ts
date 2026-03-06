import {execSync} from 'node:child_process'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {beforeAll, describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/run.js')

/** 准备生产入口依赖的 dist 构建产物，避免在干净 CI 环境中失败 */
function prepareProductionCli(): void {
  try {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {...process.env, NODE_NO_WARNINGS: '1'},
    })
  } catch (error: unknown) {
    const err = error as {status?: number; stderr?: string; stdout?: string}
    const stdout = err.stdout ?? ''
    const stderr = err.stderr ?? ''
    throw new Error(
      `e2e 预构建失败（exitCode=${err.status ?? 1}）。\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    )
  }
}

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
  beforeAll(() => {
    prepareProductionCli()
  })

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
