/**
 * Stage Engine - 状态机核心模块
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

/** 阶段定义 */
export const STAGES = {
  IDLE: 'IDLE',
  RESEARCH: 'RESEARCH',
  PLAN: 'PLAN',
  IMPLEMENT: 'IMPLEMENT',
  REVIEW: 'REVIEW',
  EXECUTE: 'EXECUTE',
  RECOVER: 'RECOVER',
} as const

export type Stage = (typeof STAGES)[keyof typeof STAGES]

/** 合法迁移矩阵 */
export const LEGAL_TRANSITIONS: Record<Stage, Stage[]> = {
  [STAGES.IDLE]: [STAGES.RESEARCH],
  [STAGES.RESEARCH]: [STAGES.PLAN],
  [STAGES.PLAN]: [STAGES.IMPLEMENT],
  [STAGES.IMPLEMENT]: [STAGES.REVIEW],
  [STAGES.REVIEW]: [STAGES.EXECUTE, STAGES.IMPLEMENT],
  [STAGES.EXECUTE]: [STAGES.IDLE, STAGES.RECOVER],
  [STAGES.RECOVER]: [STAGES.IMPLEMENT, STAGES.REVIEW, STAGES.IDLE],
}

/** 阶段元数据 */
export interface StageMetadata {
  name: Stage
  description: string
  allowedActions: string[]
  gateRequired: boolean
}

/** 阶段元数据映射 */
export const STAGE_METADATA: Record<Stage, StageMetadata> = {
  IDLE: {
    name: STAGES.IDLE,
    description: '初始状态',
    allowedActions: ['next'],
    gateRequired: false,
  },
  RESEARCH: {
    name: STAGES.RESEARCH,
    description: '收集需求与分析',
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    gateRequired: true,
  },
  PLAN: {
    name: STAGES.PLAN,
    description: '制定实现计划',
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    gateRequired: true,
  },
  IMPLEMENT: {
    name: STAGES.IMPLEMENT,
    description: '执行开发任务',
    allowedActions: ['next', 'handoff'],
    gateRequired: false,
  },
  REVIEW: {
    name: STAGES.REVIEW,
    description: '进行代码审查',
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    gateRequired: true,
  },
  EXECUTE: {
    name: STAGES.EXECUTE,
    description: '执行完成',
    allowedActions: ['next', 'handoff'],
    gateRequired: false,
  },
  RECOVER: {
    name: STAGES.RECOVER,
    description: '从中断恢复',
    allowedActions: ['next', 'handoff'],
    gateRequired: false,
  },
}

/** 验证状态迁移是否合法 */
export function isLegalTransition(from: Stage, to: Stage): boolean {
  const allowedTargets = LEGAL_TRANSITIONS[from]
  return allowedTargets?.includes(to) ?? false
}

/** 获取下一阶段建议 */
export function getNextStage(current: Stage): Stage | null {
  const nextStages = LEGAL_TRANSITIONS[current]
  return nextStages?.[0] ?? null
}

/** 获取阶段元数据 */
export function getStageMetadata(stage: Stage): StageMetadata {
  return STAGE_METADATA[stage] || {
    name: stage,
    description: '未知阶段',
    allowedActions: [],
    gateRequired: false,
  }
}

/** 状态快照 */
export interface StateSnapshot {
  sessionId: string
  stage: Stage
  lastTransition: {
    from: Stage
    to: Stage
    timestamp: string
    reason: string
  } | null
  createdAt: string
  updatedAt: string
}

/** 创建初始状态 */
export function createInitialState(sessionId: string): StateSnapshot {
  const now = new Date().toISOString()
  return {
    sessionId,
    stage: STAGES.IDLE,
    lastTransition: null,
    createdAt: now,
    updatedAt: now,
  }
}

/** 状态转换 */
export function transition(
  state: StateSnapshot,
  to: Stage,
  reason?: string,
): StateSnapshot {
  const from = state.stage

  if (!isLegalTransition(from, to)) {
    throw new Error(`非法状态迁移: ${from} -> ${to}`)
  }

  return {
    ...state,
    stage: to,
    lastTransition: {
      from,
      to,
      timestamp: new Date().toISOString(),
      reason: reason || `从 ${from} 迁移到 ${to}`,
    },
    updatedAt: new Date().toISOString(),
  }
}
