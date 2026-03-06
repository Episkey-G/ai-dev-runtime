import {Command, Flags} from '@oclif/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {success, failure} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'

/** 状态文件路径 */
function getStatePath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'snapshots', 'state.json')
}

/** 加载状态 */
function loadState(workspacePath: string): Record<string, unknown> | null {
  const statePath = getStatePath(workspacePath)
  if (!fs.existsSync(statePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
}

/** 保存状态 */
function saveState(workspacePath: string, state: Record<string, unknown>): void {
  const statePath = getStatePath(workspacePath)
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

/** Gate 阶段列表 */
const GATE_STAGES = ['RESEARCH', 'PLAN', 'REVIEW']

/** 批准当前 Gate 决策 */
export default class Approve extends Command {
  static override description = '批准当前 Gate 决策'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Approve)
    const workspacePath = path.resolve(flags['workspace-path'])

    // 检查工作区是否已初始化
    const aiDevPath = path.join(workspacePath, '.ai-dev')
    if (!fs.existsSync(aiDevPath)) {
      const error = {
        code: ErrorCodes.CFG_FILE_NOT_FOUND,
        message: '工作区未初始化，请先运行 ai-dev init',
        recovery: '请先运行 ai-dev init 初始化工作区',
      }
      outputResult(this, failure(error), flags)
      return
    }

    try {
      const state = loadState(workspacePath) as {
        stage: string
        gateDecisions?: {stage: string; decision: string; timestamp: string}[]
        lastTransition?: {from: string; to: string; timestamp: string; reason: string}
      } | null

      if (!state) {
        const error = {
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: '状态文件不存在',
          recovery: '请先运行 ai-dev next 初始化状态',
        }
        outputResult(this, failure(error), flags)
        return
      }

      const currentStage = state.stage

      // 检查当前阶段是否需要 Gate
      if (!GATE_STAGES.includes(currentStage)) {
        outputResult(
          this,
          success({
            message: `当前阶段 ${currentStage} 不需要 Gate 决策`,
            stage: currentStage,
            action: 'approved',
            note: 'Gate 决策仅在 RESEARCH, PLAN, REVIEW 阶段需要',
          }),
          flags,
        )
        return
      }

      // 记录 Gate 决策
      if (!state.gateDecisions) {
        state.gateDecisions = []
      }
      state.gateDecisions.push({
        stage: currentStage,
        decision: 'approved',
        timestamp: new Date().toISOString(),
      })

      // 根据阶段推进
      let nextStage = ''
      if (currentStage === 'RESEARCH') {
        nextStage = 'PLAN'
      } else if (currentStage === 'PLAN') {
        nextStage = 'IMPLEMENT'
      } else if (currentStage === 'REVIEW') {
        nextStage = 'EXECUTE'
      }

      if (nextStage) {
        state.stage = nextStage
        state.lastTransition = {
          from: currentStage,
          to: nextStage,
          timestamp: new Date().toISOString(),
          reason: 'Gate approved',
        }
      }

      saveState(workspacePath, state)

      outputResult(
        this,
        success({
          message: 'Gate 决策已批准',
          stage: currentStage,
          action: 'approved',
          nextStage: nextStage || null,
          gateDecisions: state.gateDecisions,
        }),
        flags,
      )
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `执行失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
