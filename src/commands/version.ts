import {Command, Flags} from '@oclif/core'
import {createRequire} from 'node:module'

import {success} from '../cli/envelope.js'

const require = createRequire(import.meta.url)

/** 输出 CLI 版本信息（支持 --json envelope） */
export default class Version extends Command {
  static override description = '输出 CLI 版本信息'
static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Version)
    const pkg = require('../../package.json') as {version: string}
    const versionInfo = {
      arch: process.arch,
      name: 'ai-dev-runtime',
      node: process.version,
      platform: process.platform,
      version: pkg.version,
    }

    if (flags.json) {
      const envelope = success(versionInfo)
      process.stdout.write(JSON.stringify(envelope, null, 2) + '\n')
      return
    }

    this.log(`ai-dev-runtime/${pkg.version} ${process.platform}-${process.arch} node-${process.version}`)
  }
}
