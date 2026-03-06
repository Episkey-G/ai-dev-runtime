import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 拒绝当前 Gate 决策 */
export default class Reject extends Command {
  static override description = '拒绝当前 Gate 决策'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Reject)
    const envelope = success({message: 'reject 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
