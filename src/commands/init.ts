import {Command, Flags} from '@oclif/core'
import path from 'node:path'

import {failure, success} from '../cli/envelope.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'
import {outputResult} from '../cli/output.js'
import {initializeWorkspace, isValidPath} from '../lib/workspace.js'

export default class Init extends Command {
  static override description = '初始化工作区，生成零配置默认设置'
static override flags = {
    force: Flags.boolean({
      default: false,
      description: '强制重新初始化（覆盖已有配置）',
    }),
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({
      default: '.',
      description: '指定工作区路径（默认当前目录）',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const targetPath = path.resolve(flags['workspace-path'])

    // 验证路径
    if (!isValidPath(targetPath)) {
      const error = {
        code: ErrorCodes.CFG_WORKSPACE_PATH_INVALID,
        message: '工作区路径无效',
        recovery: RecoveryActions.CFG_WORKSPACE_PATH_INVALID,
      }
      outputResult(this, failure(error), flags)
      return
    }

    try {
      const startTime = Date.now()
      const result = await initializeWorkspace(targetPath, flags.force)

      // 60s 超时检查（NFR3）
      const duration = Date.now() - startTime
      if (duration > 60_000) {
        const error = {
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `初始化超时（${duration}ms），超过 60s 限制`,
          recovery: '请检查目标目录性能或减少并发操作',
        }
        outputResult(this, failure(error), flags)
        return
      }

      if (result.idempotent) {
        // 已存在，返回幂等成功
        outputResult(
          this,
          success({
            idempotent: true,
            message: '工作区已存在',
            nextStep: '执行 ai-dev next 启动首个编排',
            workspacePath: result.workspacePath,
          }),
          flags,
        )
        return
      }

      // 初始化成功
      outputResult(
        this,
        success({
          created: result.created,
          duration: `${duration}ms`,
          idempotent: false,
          message: '工作区初始化成功',
          nextStep: '执行 ai-dev next 启动首个编排',
          workspacePath: result.workspacePath,
        }),
        flags,
      )
    } catch (error_) {
      const errnoCode = (error_ as NodeJS.ErrnoException).code
      const rawMessage = (error_ as Error).message
      const errorCode =
        errnoCode === 'EACCES' || errnoCode === 'EPERM' || rawMessage === ErrorCodes.CFG_WORKSPACE_PERMISSION
          ? ErrorCodes.CFG_WORKSPACE_PERMISSION
          : (rawMessage as (typeof ErrorCodes)[keyof typeof ErrorCodes]) || ErrorCodes.CFG_VALIDATION_FAILED

      const error = {
        code: errorCode as (typeof ErrorCodes)[keyof typeof ErrorCodes],
        message:
          errorCode === ErrorCodes.CFG_WORKSPACE_PERMISSION
            ? '初始化失败: 工作区目录无写权限'
            : `初始化失败: ${(error_ as Error).message}`,
        recovery:
          RecoveryActions[errorCode as keyof typeof RecoveryActions] ||
          '请检查错误信息并重试',
      }
      outputResult(this, failure(error), flags)
    }
  }
}
