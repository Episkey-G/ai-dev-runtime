import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 推进编排到下一阶段 */
export default class Next extends Command {
  static override description = '推进编排到下一阶段'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Next)
    const envelope = success({message: 'next 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
