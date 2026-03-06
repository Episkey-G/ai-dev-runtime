import {execSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {checkCriticalDependencies, checkNodeVersion, checkNpmAvailability, runPreflightChecks} from '../../src/cli/preflight.js'

vi.mock('node:child_process', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:child_process')>()
  return {...original, execSync: vi.fn(original.execSync)}
})

vi.mock('node:fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs')>()
  return {...original, existsSync: vi.fn(original.existsSync)}
})

describe('preflight', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkNodeVersion()', () => {
    it('Node 24+ 应返回 null（通过检查）', () => {
      const result = checkNodeVersion()
      expect(result).toBeNull()
    })

    it('Node 版本不足时应返回 CFG_NODE_VERSION 错误', () => {
      const originalVersions = process.versions
      Object.defineProperty(process, 'versions', {
        configurable: true,
        value: {...originalVersions, node: '18.0.0'},
      })

      const result = checkNodeVersion()
      expect(result).not.toBeNull()
      expect(result!.code).toBe('CFG_NODE_VERSION')
      expect(result!.message).toContain('18.0.0')
      expect(result!.details).toEqual({current: '18.0.0', required: '>= 24'})
      expect(result!.recovery).toBeDefined()
      expect(result!.recovery!.length).toBeGreaterThan(0)

      Object.defineProperty(process, 'versions', {
        configurable: true,
        value: originalVersions,
      })
    })
  })

  describe('checkNpmAvailability()', () => {
    it('npm 可用时应返回 null', () => {
      const result = checkNpmAvailability()
      expect(result).toBeNull()
    })

    it('npm 不可用时应返回 CFG_NPM_UNAVAILABLE 错误', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('command not found: npm')
      })

      const result = checkNpmAvailability()
      expect(result).not.toBeNull()
      expect(result!.code).toBe('CFG_NPM_UNAVAILABLE')
      expect(result!.message).toContain('npm')
      expect(result!.recovery).toBeDefined()
      expect(result!.recovery!.length).toBeGreaterThan(0)
    })
  })

  describe('checkCriticalDependencies()', () => {
    it('依赖存在时应返回 null', () => {
      const result = checkCriticalDependencies()
      expect(result).toBeNull()
    })

    it('依赖缺失时应返回 CFG_DEPENDENCY_MISSING 错误', () => {
      vi.mocked(existsSync).mockReturnValue(false)

      const result = checkCriticalDependencies()
      expect(result).not.toBeNull()
      expect(result!.code).toBe('CFG_DEPENDENCY_MISSING')
      expect(result!.message).toContain('@oclif/core')
      expect(result!.details).toEqual({missing: ['@oclif/core']})
      expect(result!.recovery).toBeDefined()
      expect(result!.recovery!.length).toBeGreaterThan(0)
    })
  })

  describe('runPreflightChecks()', () => {
    it('全部通过时应返回 null', () => {
      const result = runPreflightChecks()
      expect(result).toBeNull()
    })

    it('Node 版本失败时应最先返回该错误', () => {
      const originalVersions = process.versions
      Object.defineProperty(process, 'versions', {
        configurable: true,
        value: {...originalVersions, node: '16.0.0'},
      })

      const result = runPreflightChecks()
      expect(result!.code).toBe('CFG_NODE_VERSION')

      Object.defineProperty(process, 'versions', {
        configurable: true,
        value: originalVersions,
      })
    })
  })
})
