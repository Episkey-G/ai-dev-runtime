import {existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {initializeWorkspace} from '../../src/core/workspace/workspace-initializer.js'
import {resolveWorkspacePaths} from '../../src/core/workspace/workspace-layout.js'

describe('workspace-initializer', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `ai-dev-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, {recursive: true})
  })

  afterEach(() => {
    rmSync(testDir, {force: true, recursive: true})
  })

  describe('首次初始化', () => {
    it('应创建所有目录和文件', async () => {
      const result = await initializeWorkspace(testDir)
      const paths = resolveWorkspacePaths(testDir)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      for (const dir of paths.directories) {
        expect(existsSync(dir)).toBe(true)
      }

      // events.jsonl 和 state.json 应被创建
      expect(existsSync(paths.eventsFile)).toBe(true)
      expect(existsSync(paths.stateFile)).toBe(true)
    })

    it('created_paths 应包含所有新创建的路径', async () => {
      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.created_paths.length).toBeGreaterThan(0)
      expect(result.data.skipped_paths).toHaveLength(0)
    })

    it('应包含 duration_ms 字段', async () => {
      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.duration_ms).toBeTypeOf('number')
      expect(result.data.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('events.jsonl 应为空文件', async () => {
      await initializeWorkspace(testDir)
      const paths = resolveWorkspacePaths(testDir)
      const content = await readFile(paths.eventsFile, 'utf8')
      expect(content).toBe('')
    })

    it('state.json 应为空 JSON 对象', async () => {
      await initializeWorkspace(testDir)
      const paths = resolveWorkspacePaths(testDir)
      const content = await readFile(paths.stateFile, 'utf8')
      expect(JSON.parse(content)).toEqual({})
    })
  })

  describe('幂等初始化（重复执行）', () => {
    it('不应覆盖已有 events.jsonl', async () => {
      const paths = resolveWorkspacePaths(testDir)

      // 首次初始化
      await initializeWorkspace(testDir)

      // 写入测试数据
      const testEvent = '{"type":"test_event"}\n'
      writeFileSync(paths.eventsFile, testEvent)

      // 二次初始化
      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // events.jsonl 内容不变
      const content = await readFile(paths.eventsFile, 'utf8')
      expect(content).toBe(testEvent)
    })

    it('不应覆盖已有 state.json', async () => {
      const paths = resolveWorkspacePaths(testDir)

      await initializeWorkspace(testDir)
      const testState = JSON.stringify({stage: 'init'})
      writeFileSync(paths.stateFile, testState)

      await initializeWorkspace(testDir)

      const content = await readFile(paths.stateFile, 'utf8')
      expect(content).toBe(testState)
    })

    it('已存在资源应标记为 skipped', async () => {
      await initializeWorkspace(testDir)
      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.skipped_paths.length).toBeGreaterThan(0)
      expect(result.data.created_paths).toHaveLength(0)
    })
  })

  describe('错误处理', () => {
    it('空路径应返回错误', async () => {
      const result = await initializeWorkspace('')

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toMatch(/^CFG_/)
    })

    it('目录路径被普通文件占用时应返回错误', async () => {
      const paths = resolveWorkspacePaths(testDir)
      // 用普通文件占位 .ai-dev 路径
      writeFileSync(paths.root, 'not a directory')

      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toBe('CFG_INIT_FAILED')
      expect(result.error.message).toContain('不是目录')
    })

    it('工作区根目录为符号链接时应返回错误', async () => {
      const paths = resolveWorkspacePaths(testDir)
      const targetDir = join(testDir, 'real-dir')
      mkdirSync(targetDir)
      symlinkSync(targetDir, paths.root)

      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toBe('CFG_INIT_FAILED')
      expect(result.error.message).toContain('符号链接')
    })

    it('数据文件为符号链接时应返回错误', async () => {
      const paths = resolveWorkspacePaths(testDir)
      // 先正常初始化
      await initializeWorkspace(testDir)
      // 将 events.jsonl 替换为符号链接
      const externalFile = join(testDir, 'external.jsonl')
      writeFileSync(externalFile, '')
      rmSync(paths.eventsFile)
      symlinkSync(externalFile, paths.eventsFile)

      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toBe('CFG_INIT_FAILED')
      expect(result.error.message).toContain('符号链接')
    })

    it('配置文件为符号链接时应返回错误', async () => {
      const paths = resolveWorkspacePaths(testDir)
      await initializeWorkspace(testDir)
      // 将 config.yaml 替换为符号链接
      const externalConfig = join(testDir, 'external-config.yaml')
      writeFileSync(externalConfig, 'custom: true')
      rmSync(paths.configFile)
      symlinkSync(externalConfig, paths.configFile)

      const result = await initializeWorkspace(testDir)

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toBe('CFG_INIT_FAILED')
    })

    it('不存在的父目录应返回错误', async () => {
      const result = await initializeWorkspace('/nonexistent/path/that/does/not/exist')

      expect(result.ok).toBe(false)
      if (result.ok) return

      expect(result.error.code).toMatch(/^CFG_/)
      expect(result.error.recovery).toBeDefined()
    })
  })
})
