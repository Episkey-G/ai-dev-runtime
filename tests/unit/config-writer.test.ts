import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {writeDefaultConfig} from '../../src/config/config-writer.js'

describe('config-writer', () => {
  let testDir: string
  let configPath: string

  beforeEach(() => {
    testDir = join(tmpdir(), `ai-dev-cfg-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, {recursive: true})
    configPath = join(testDir, 'config.yaml')
  })

  afterEach(() => {
    rmSync(testDir, {force: true, recursive: true})
  })

  it('首次写入应创建 config.yaml 并返回 created', async () => {
    const result = await writeDefaultConfig(configPath)

    expect(result.status).toBe('created')
    expect(existsSync(configPath)).toBe(true)

    const content = readFileSync(configPath, 'utf8')
    expect(content).toContain('schema_version')
    expect(content).toContain('gate_policy')
    expect(content).toContain('routing')
  })

  it('已存在配置文件时应返回 kept_existing 且内容不变', async () => {
    const existingContent = '# 用户自定义配置\ncustom: true\n'
    writeFileSync(configPath, existingContent)

    const result = await writeDefaultConfig(configPath)

    expect(result.status).toBe('kept_existing')
    const content = readFileSync(configPath, 'utf8')
    expect(content).toBe(existingContent)
  })
})
