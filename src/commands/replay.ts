import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 确定性回放事件序列 */
export default class Replay extends Command {
  static override description = '确定性回放事件序列'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Replay)
    const envelope = success({message: 'replay 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
