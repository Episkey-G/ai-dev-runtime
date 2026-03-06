import {Command, Flags} from '@oclif/core'

import {failure, success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'
import {initializeWorkspace} from '../core/workspace/workspace-initializer.js'

/** 初始化工作区，生成零配置默认设置 */
export default class Init extends Command {
  static override description = '初始化工作区，生成零配置默认设置'
  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const result = await initializeWorkspace(process.cwd())

    if (result.ok) {
      const envelope = success(result.data)
      outputResult(this, envelope, flags)
    } else {
      const envelope = failure(result.error)
      outputResult(this, envelope, flags)
    }
  }
}
