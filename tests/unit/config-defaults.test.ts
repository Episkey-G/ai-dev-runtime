import {describe, expect, it} from 'vitest'

import {getDefaultConfig} from '../../src/config/defaults.js'

describe('config defaults', () => {
  it('应返回包含 gate_policy 的默认配置', () => {
    const config = getDefaultConfig()
    expect(config.gate_policy).toBeDefined()
    expect(config.gate_policy.default_action).toBe('prompt')
  })

  it('应返回包含 routing 的默认配置', () => {
    const config = getDefaultConfig()
    expect(config.routing).toBeDefined()
    expect(config.routing.default_agent).toBe('claude')
  })

  it('应返回包含 schema_version 的默认配置', () => {
    const config = getDefaultConfig()
    expect(config.schema_version).toBeDefined()
    expect(typeof config.schema_version).toBe('string')
  })
})
