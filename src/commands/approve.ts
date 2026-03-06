import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 批准当前 Gate 决策 */
export default class Approve extends Command {
  static override description = '批准当前 Gate 决策'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Approve)
    const envelope = success({message: 'approve 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
