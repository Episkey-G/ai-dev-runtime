import {describe, expect, it, vi, afterEach} from 'vitest'

import {checkNodeVersion, checkNpmAvailability} from '../../src/cli/preflight.js'

describe('preflight', () => {
  describe('checkNodeVersion()', () => {
    it('Node 24+ 应返回 null（通过检查）', () => {
      const result = checkNodeVersion()
      // 当前测试环境 Node 24，应通过
      expect(result).toBeNull()
    })

    it('Node 版本不足时应返回 CFG_NODE_VERSION 错误', () => {
      // 模拟低版本 Node
      const originalVersions = process.versions
      Object.defineProperty(process, 'versions', {
        value: {...originalVersions, node: '18.0.0'},
        configurable: true,
      })

      const result = checkNodeVersion()
      expect(result).not.toBeNull()
      expect(result!.code).toBe('CFG_NODE_VERSION')
      expect(result!.message).toContain('18.0.0')
      expect(result!.recovery).toBeDefined()

      // 恢复
      Object.defineProperty(process, 'versions', {
        value: originalVersions,
        configurable: true,
      })
    })
  })

  describe('checkNpmAvailability()', () => {
    it('npm 可用时应返回 null', () => {
      const result = checkNpmAvailability()
      expect(result).toBeNull()
    })
  })
})
