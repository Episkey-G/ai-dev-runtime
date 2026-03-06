import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 初始化工作区，生成零配置默认设置 */
export default class Init extends Command {
  static override description = '初始化工作区，生成零配置默认设置'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const envelope = success({message: 'init 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
