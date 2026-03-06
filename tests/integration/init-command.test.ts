/**
 * init 命令集成测试
 *
 * 从项目根目录运行 init 命令，验证 --json envelope 结构。
 * 隔离目录测试（首次初始化、幂等、权限）在 e2e 中覆盖。
 */
import {execSync} from 'node:child_process'
import {rmSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterAll, describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/dev.js')

/** 运行 CLI 命令 */
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

describe('init 命令集成测试', () => {
  afterAll(() => {
    rmSync(join(PROJECT_ROOT, '.ai-dev'), {force: true, recursive: true})
  })

  it('init 应返回退出码 0', () => {
    const {exitCode} = runCli('init')
    expect(exitCode).toBe(0)
  })

  it('init human 模式应输出创建摘要', () => {
    const {stdout} = runCli('init')
    expect(stdout).toContain('created_paths')
  })

  it('init --json 应返回完整 envelope 结构', () => {
    const {stdout} = runCli('init --json')
    const envelope = JSON.parse(stdout)

    expect(envelope.ok).toBe(true)
    expect(envelope.data).toHaveProperty('created_paths')
    expect(envelope.data).toHaveProperty('skipped_paths')
    expect(envelope.data).toHaveProperty('config_path')
    expect(envelope.data).toHaveProperty('next_step')
    expect(envelope.meta).toHaveProperty('version')
    expect(envelope.meta).toHaveProperty('timestamp')
  })

  it('init --json 二次执行应返回 skipped_paths', () => {
    // 首次
    runCli('init')
    // 二次
    const {stdout} = runCli('init --json')
    const envelope = JSON.parse(stdout)

    expect(envelope.ok).toBe(true)
    expect(envelope.data.created_paths).toHaveLength(0)
    expect(envelope.data.skipped_paths.length).toBeGreaterThan(0)
  })
})
