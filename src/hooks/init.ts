import {Hook} from '@oclif/core'

import {failure} from '../cli/envelope.js'
import {runPreflightChecks} from '../cli/preflight.js'

/**
 * init hook：每次命令执行前运行前置检查。
 * 检查 Node 版本、npm 可用性等，不满足时输出结构化错误并退出。
 */
const hook: Hook<'init'> = async function (options) {
  const error = runPreflightChecks()
  if (error) {
    const isJson = process.argv.includes('--json')
    if (isJson) {
      const envelope = failure(error)
      process.stdout.write(JSON.stringify(envelope, null, 2) + '\n')
    } else {
      process.stderr.write(`错误 [${error.code}]: ${error.message}\n`)
      if (error.recovery) {
        process.stderr.write(`恢复方法: ${error.recovery}\n`)
      }
    }

    options.context.exit(1)
  }
}

export default hook
