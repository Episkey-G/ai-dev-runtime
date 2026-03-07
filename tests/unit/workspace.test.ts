import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'

import {getDefaultConfig, initializeWorkspace} from '../../src/lib/workspace.js'

describe('workspace', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })

  it('默认 gate policy 应包含 5 个策略', () => {
    const config = getDefaultConfig('.')
    expect(config.defaults.gatePolicy).toEqual([
      'prd_freeze',
      'architecture_freeze',
      'high_complexity',
      'release',
      'fix_loop',
    ])
  })

  it('初始化状态应包含 snapshot anchor 字段', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-dev-runtime-ws-'))
    dirs.push(workspace)

    const result = await initializeWorkspace(workspace)
    expect(result.initialized).toBe(true)

    const statePath = path.join(workspace, '.ai-dev', 'snapshots', 'state.json')
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    expect(state).toHaveProperty('lastEventId', null)
    expect(state).toHaveProperty('lastEventChecksum', null)
  })
})
