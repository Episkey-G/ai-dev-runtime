import {describe, expect, it} from 'vitest'

import {success, failure} from '../../src/cli/envelope.js'
import type {SuccessEnvelope, FailureEnvelope} from '../../src/cli/envelope.js'
import {ErrorCodes} from '../../src/cli/error-codes.js'

describe('envelope', () => {
  describe('success()', () => {
    it('应返回 ok: true 的 envelope', () => {
      const result: SuccessEnvelope<{message: string}> = success({message: '测试'})
      expect(result.ok).toBe(true)
      expect(result.data.message).toBe('测试')
    })

    it('应包含 meta 字段（version + timestamp）', () => {
      const result = success({})
      expect(result.meta).toBeDefined()
      expect(result.meta.version).toBeDefined()
      expect(result.meta.timestamp).toBeDefined()
      // timestamp 应为 ISO 8601 格式
      expect(() => new Date(result.meta.timestamp)).not.toThrow()
    })
  })

  describe('failure()', () => {
    it('应返回 ok: false 的 envelope', () => {
      const result: FailureEnvelope = failure({
        code: ErrorCodes.CFG_NODE_VERSION,
        message: '版本不满足',
      })
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('CFG_NODE_VERSION')
      expect(result.error.message).toBe('版本不满足')
    })

    it('应支持 details 和 recovery 字段', () => {
      const result = failure({
        code: ErrorCodes.CFG_DEPENDENCY_MISSING,
        message: '依赖缺失',
        details: {missing: ['foo']},
        recovery: '运行 npm install',
      })
      expect(result.error.details).toEqual({missing: ['foo']})
      expect(result.error.recovery).toBe('运行 npm install')
    })

    it('应包含 meta 字段', () => {
      const result = failure({
        code: ErrorCodes.CFG_FILE_NOT_FOUND,
        message: '文件不存在',
      })
      expect(result.meta.version).toBeDefined()
      expect(result.meta.timestamp).toBeDefined()
    })
  })

  describe('JSON 序列化', () => {
    it('success envelope 序列化后应保持 snake_case 字段结构', () => {
      const result = success({test_value: 1})
      const json = JSON.parse(JSON.stringify(result))
      expect(json).toHaveProperty('ok', true)
      expect(json).toHaveProperty('data')
      expect(json).toHaveProperty('meta')
      expect(json.meta).toHaveProperty('version')
      expect(json.meta).toHaveProperty('timestamp')
    })

    it('failure envelope 序列化后应包含 error 对象', () => {
      const result = failure({
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: '校验失败',
      })
      const json = JSON.parse(JSON.stringify(result))
      expect(json).toHaveProperty('ok', false)
      expect(json).toHaveProperty('error')
      expect(json.error).toHaveProperty('code')
      expect(json.error).toHaveProperty('message')
    })
  })
})
