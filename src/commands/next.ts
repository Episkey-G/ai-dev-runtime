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
function loadState(workspacePath: string): Record<string, unknown> {
  const statePath = getStatePath(workspacePath)
  if (!fs.existsSync(statePath)) {
    // 初始化状态
    return {
      sessionId: null,
      stage: 'IDLE',
      lastTransition: null,
      createdAt: new Date().toISOString(),
    }
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
}

/** 保存状态 */
function saveState(workspacePath: string, state: Record<string, unknown>): void {
  const statePath = getStatePath(workspacePath)
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

/** 阶段定义 */
const STAGES = ['IDLE', 'RESEARCH', 'PLAN', 'IMPLEMENT', 'REVIEW', 'EXECUTE', 'RECOVER'] as const

/** 合法迁移 */
const LEGAL_TRANSITIONS: Record<string, string[]> = {
  IDLE: ['RESEARCH'],
  RESEARCH: ['PLAN'],
  PLAN: ['IMPLEMENT'],
  IMPLEMENT: ['REVIEW'],
  REVIEW: ['EXECUTE', 'IMPLEMENT'],
  EXECUTE: ['IDLE', 'RECOVER'],
  RECOVER: ['IMPLEMENT', 'REVIEW', 'IDLE'],
}

/** Next 命令：根据当前阶段生成下一步建议 */
export default class Next extends Command {
  static override description = '基于当前阶段生成下一步建议并推进工作流'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Next)
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
      // 加载当前状态
      const state = loadState(workspacePath) as {
        stage: string
        sessionId: string | null
        lastTransition: Record<string, unknown> | null
      }

      const currentStage = state.stage

      // 获取当前阶段的允许动作
      const allowedActions = getAllowedActions(currentStage)

      // 获取推荐动作
      const recommendedAction = getRecommendedAction(currentStage)

      // 检查是否需要 Gate 决策
      const gateRequired = isGateRequired(currentStage)

      // 生成建议
      const suggestion = {
        currentStage,
        allowedActions,
        recommendedAction,
        gateRequired,
        reason: getTransitionReason(currentStage),
      }

      // 如果是首次运行，写入初始事件
      if (!state.sessionId) {
        state.sessionId = generateSessionId()
        state.stage = 'RESEARCH' // 首次推进到 RESEARCH
        state.lastTransition = {
          from: 'IDLE',
          to: 'RESEARCH',
          timestamp: new Date().toISOString(),
          reason: '初始化工作流',
        }
        saveState(workspacePath, state)
      }

      outputResult(
        this,
        success({
          message: '已生成下一步建议',
          currentStage: state.stage,
          suggestion,
          nextStep: '执行 ai-dev handoff 切换 Agent 或 ai-dev approve 进入下一阶段',
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

/** 获取允许动作 */
function getAllowedActions(stage: string): string[] {
  const actions = ['next']

  if (stage !== 'IDLE' && stage !== 'RECOVER') {
    actions.push('handoff')
  }

  if (stage === 'RESEARCH' || stage === 'PLAN' || stage === 'REVIEW') {
    actions.push('approve', 'reject', 'other')
  }

  return actions
}

/** 获取推荐动作 */
function getRecommendedAction(stage: string): string {
  const recommendations: Record<string, string> = {
    IDLE: 'next',
    RESEARCH: 'handoff',
    PLAN: 'next',
    IMPLEMENT: 'next',
    REVIEW: 'approve',
    EXECUTE: 'next',
    RECOVER: 'next',
  }
  return recommendations[stage] || 'next'
}

/** 检查是否需要 Gate */
function isGateRequired(stage: string): boolean {
  const gateStages = ['RESEARCH', 'PLAN', 'REVIEW']
  return gateStages.includes(stage)
}

/** 获取迁移原因 */
function getTransitionReason(stage: string): string {
  const reasons: Record<string, string> = {
    IDLE: '初始状态',
    RESEARCH: '收集需求与分析',
    PLAN: '制定实现计划',
    IMPLEMENT: '执行开发任务',
    REVIEW: '进行代码审查',
    EXECUTE: '执行完成',
    RECOVER: '从中断恢复',
  }
  return reasons[stage] || '未知阶段'
}

/** 生成会话 ID */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}
