/**
 * init 工作区端到端测试
 *
 * 使用 bin/run.js（编译后入口）在隔离临时目录中测试：
 * - 首次初始化创建完整目录/文件
 * - 重复初始化幂等不覆盖
 * - 只读目录权限失败
 * - 性能耗时可观测
 */
import {execSync} from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterEach, beforeAll, beforeEach, describe, expect, it} from 'vitest'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = resolve(PROJECT_ROOT, 'bin/run.js')

/** 构建 dist（仅当缺少关键编译产物时触发） */
function buildCliIfNeeded(): void {
  const initJsPath = resolve(PROJECT_ROOT, 'dist/commands/init.js')
  if (existsSync(initJsPath)) return

  try {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {...process.env, NODE_NO_WARNINGS: '1'},
    })
  } catch (error: unknown) {
    const err = error as {status?: number; stderr?: string; stdout?: string}
    throw new Error(`e2e 预构建失败（exitCode=${err.status ?? 1}）\nstderr: ${err.stderr ?? ''}\nstdout: ${err.stdout ?? ''}`)
  }
}

/** 运行 CLI 命令 */
function runCli(args: string, cwd: string): {exitCode: number; stderr: string; stdout: string;} {
  try {
    const env = {...process.env}
    delete env.NODE_OPTIONS
    delete env.NODE_ENV
    const stdout = execSync(`${CLI} ${args}`, {cwd, encoding: 'utf8', env})
    return {exitCode: 0, stderr: '', stdout}
  } catch (error: unknown) {
    const err = error as {status?: number; stderr?: string; stdout?: string}
    return {
      exitCode: err.status ?? 1,
      stderr: err.stderr ?? '',
      stdout: err.stdout ?? '',
    }
  }
}

describe('init 工作区 e2e 测试', () => {
  let testDir: string

  beforeAll(() => {
    buildCliIfNeeded()
  })

  beforeEach(() => {
    testDir = join(tmpdir(), `ai-dev-e2e-init-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, {recursive: true})
  })

  afterEach(() => {
    try {
      chmodSync(testDir, 0o755)
    } catch {
      // 忽略
    }

    rmSync(testDir, {force: true, recursive: true})
  })

  describe('首次初始化', () => {
    it('应创建完整 .ai-dev 目录结构', () => {
      const {exitCode} = runCli('init', testDir)
      expect(exitCode).toBe(0)

      expect(existsSync(join(testDir, '.ai-dev'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/events'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/snapshots'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/context'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/events/events.jsonl'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/snapshots/state.json'))).toBe(true)
      expect(existsSync(join(testDir, '.ai-dev/config.yaml'))).toBe(true)
    })

    it('--json 应返回 created_paths 非空', () => {
      const {stdout} = runCli('init --json', testDir)
      const envelope = JSON.parse(stdout)

      expect(envelope.ok).toBe(true)
      expect(envelope.data.created_paths.length).toBeGreaterThan(0)
      expect(envelope.data.skipped_paths).toHaveLength(0)
      expect(envelope.data.config_path).toContain('.ai-dev/config.yaml')
      expect(envelope.data.next_step).toBeTruthy()
    })

    it('config.yaml 应包含默认配置', () => {
      runCli('init', testDir)
      const content = readFileSync(join(testDir, '.ai-dev/config.yaml'), 'utf8')
      expect(content).toContain('schema_version')
      expect(content).toContain('gate_policy')
      expect(content).toContain('routing')
    })

    it('events.jsonl 应为空文件', () => {
      runCli('init', testDir)
      const content = readFileSync(join(testDir, '.ai-dev/events/events.jsonl'), 'utf8')
      expect(content).toBe('')
    })

    it('state.json 应为空 JSON 对象', () => {
      runCli('init', testDir)
      const content = readFileSync(join(testDir, '.ai-dev/snapshots/state.json'), 'utf8')
      expect(JSON.parse(content)).toEqual({})
    })
  })

  describe('幂等初始化', () => {
    it('第二次执行应返回退出码 0', () => {
      runCli('init', testDir)
      const {exitCode} = runCli('init', testDir)
      expect(exitCode).toBe(0)
    })

    it('不应覆盖已有 events.jsonl', () => {
      runCli('init', testDir)

      const eventsFile = join(testDir, '.ai-dev/events/events.jsonl')
      writeFileSync(eventsFile, '{"type":"test_event"}\n')

      runCli('init', testDir)

      const content = readFileSync(eventsFile, 'utf8')
      expect(content).toBe('{"type":"test_event"}\n')
    })

    it('不应覆盖已有 state.json', () => {
      runCli('init', testDir)

      const stateFile = join(testDir, '.ai-dev/snapshots/state.json')
      writeFileSync(stateFile, '{"stage":"running"}')

      runCli('init', testDir)

      const content = readFileSync(stateFile, 'utf8')
      expect(content).toBe('{"stage":"running"}')
    })

    it('不应覆盖已有 config.yaml', () => {
      runCli('init', testDir)

      const configFile = join(testDir, '.ai-dev/config.yaml')
      const customConfig = '# 自定义配置\ncustom: true\n'
      writeFileSync(configFile, customConfig)

      runCli('init', testDir)

      const content = readFileSync(configFile, 'utf8')
      expect(content).toBe(customConfig)
    })

    it('--json 应返回 skipped_paths 非空', () => {
      runCli('init', testDir)
      const {stdout} = runCli('init --json', testDir)
      const envelope = JSON.parse(stdout)

      expect(envelope.ok).toBe(true)
      expect(envelope.data.created_paths).toHaveLength(0)
      expect(envelope.data.skipped_paths.length).toBeGreaterThan(0)
    })
  })

  describe('权限失败', () => {
    it('只读目录应返回错误 envelope', () => {
      const readonlyDir = join(testDir, 'readonly')
      mkdirSync(readonlyDir)
      chmodSync(readonlyDir, 0o444)

      const {exitCode, stdout} = runCli('init --json', readonlyDir)

      // 恢复权限以便清理
      chmodSync(readonlyDir, 0o755)

      // 命令应失败或返回错误 envelope
      if (exitCode === 0) {
        const envelope = JSON.parse(stdout)
        expect(envelope.ok).toBe(false)
        expect(envelope.error.code).toMatch(/^CFG_/)
        expect(envelope.error.recovery).toBeDefined()
      } else {
        // 非零退出码也可接受
        expect(exitCode).not.toBe(0)
      }
    })
  })

  describe('性能', () => {
    it('初始化应包含可机读耗时字段 duration_ms', () => {
      const {stdout} = runCli('init --json', testDir)
      const envelope = JSON.parse(stdout)

      expect(envelope.meta.timestamp).toBeDefined()
      expect(() => new Date(envelope.meta.timestamp)).not.toThrow()
      expect(envelope.data.duration_ms).toBeTypeOf('number')
      expect(envelope.data.duration_ms).toBeGreaterThanOrEqual(0)
      expect(envelope.data.duration_ms).toBeLessThan(60_000)
    })
  })
})
