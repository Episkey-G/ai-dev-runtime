import {Command, Flags} from '@oclif/core'

import {success} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'

/** 从中断点恢复编排（含 preflight 校验） */
export default class Resume extends Command {
  static override description = '从中断点恢复编排（含 preflight 校验）'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Resume)
    const envelope = success({message: 'resume 命令占位 — 尚未实现'})
    outputResult(this, envelope, flags)
  }
}
