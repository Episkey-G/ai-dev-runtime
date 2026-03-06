import {describe, expect, it} from 'vitest'

import {ErrorCodes, RecoveryActions} from '../../src/cli/error-codes.js'

describe('ErrorCodes', () => {
  it('应包含所有 CFG_* 族错误码', () => {
    expect(ErrorCodes.CFG_NODE_VERSION).toBe('CFG_NODE_VERSION')
    expect(ErrorCodes.CFG_NPM_UNAVAILABLE).toBe('CFG_NPM_UNAVAILABLE')
    expect(ErrorCodes.CFG_DEPENDENCY_MISSING).toBe('CFG_DEPENDENCY_MISSING')
    expect(ErrorCodes.CFG_FILE_NOT_FOUND).toBe('CFG_FILE_NOT_FOUND')
    expect(ErrorCodes.CFG_VALIDATION_FAILED).toBe('CFG_VALIDATION_FAILED')
  })

  it('每个错误码应有对应的恢复动作', () => {
    for (const code of Object.values(ErrorCodes)) {
      expect(RecoveryActions[code]).toBeDefined()
      expect(RecoveryActions[code].length).toBeGreaterThan(0)
    }
  })
})
