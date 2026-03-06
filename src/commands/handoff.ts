import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 执行跨 Agent 上下文交接 */
export default class Handoff extends Command {
  static override description = '执行跨 Agent 上下文交接'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Handoff)
    const envelope = success({message: 'handoff 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
