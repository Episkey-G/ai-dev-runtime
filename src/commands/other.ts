import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 提交 Gate 自定义决策（非 approve/reject） */
export default class Other extends Command {
  static override description = '提交 Gate 自定义决策（非 approve/reject）'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Other)
    const envelope = success({message: 'other 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
