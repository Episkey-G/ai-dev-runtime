import {Command} from '@oclif/core'

/**
 * Config 命令组
 * 用于查看和更新工作区配置
 *
 * 子命令：
 *   show    - 查看当前配置
 *   set     - 更新配置
 *   validate - 校验配置
 */
export default class Config extends Command {
  static override description = '查看和更新工作区配置'

  async run(): Promise<void> {
    this.log('请指定子命令: config show, config set, config validate')
    this.log('使用 ai-dev config --help 查看更多信息')
  }
}
