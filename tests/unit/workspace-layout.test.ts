import {resolve} from 'node:path'
import {describe, expect, it} from 'vitest'

import {
  resolveWorkspacePaths,
  WORKSPACE_DIR,
} from '../../src/core/workspace/workspace-layout.js'

describe('workspace-layout', () => {
  it('WORKSPACE_DIR 应为 .ai-dev', () => {
    expect(WORKSPACE_DIR).toBe('.ai-dev')
  })

  it('resolveWorkspacePaths 应返回基于 baseDir 的完整路径', () => {
    const base = '/tmp/test-project'
    const paths = resolveWorkspacePaths(base)

    expect(paths.root).toBe(resolve(base, '.ai-dev'))
    expect(paths.eventsDir).toBe(resolve(base, '.ai-dev/events'))
    expect(paths.snapshotsDir).toBe(resolve(base, '.ai-dev/snapshots'))
    expect(paths.contextDir).toBe(resolve(base, '.ai-dev/context'))
    expect(paths.eventsFile).toBe(resolve(base, '.ai-dev/events/events.jsonl'))
    expect(paths.stateFile).toBe(resolve(base, '.ai-dev/snapshots/state.json'))
    expect(paths.configFile).toBe(resolve(base, '.ai-dev/config.yaml'))
  })

  it('resolveWorkspacePaths 返回的目录列表应按创建顺序排列', () => {
    const paths = resolveWorkspacePaths('/tmp/test')
    expect(paths.directories).toHaveLength(4)
    expect(paths.directories[0]).toBe(paths.root)
    expect(paths.directories[1]).toBe(paths.eventsDir)
    expect(paths.directories[2]).toBe(paths.snapshotsDir)
    expect(paths.directories[3]).toBe(paths.contextDir)
  })

  it('resolveWorkspacePaths 返回的文件列表应包含所有初始文件', () => {
    const paths = resolveWorkspacePaths('/tmp/test')
    expect(paths.files).toHaveLength(3)
    expect(paths.files).toContain(paths.eventsFile)
    expect(paths.files).toContain(paths.stateFile)
    expect(paths.files).toContain(paths.configFile)
  })
})
