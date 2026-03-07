/**
 * Stage Engine - 状态机核心模块
 */

/** 阶段定义 */
export const STAGES = {
  EXECUTE: 'EXECUTE',
  IDLE: 'IDLE',
  IMPLEMENT: 'IMPLEMENT',
  PLAN: 'PLAN',
  RECOVER: 'RECOVER',
  RESEARCH: 'RESEARCH',
  REVIEW: 'REVIEW',
} as const

export type Stage = (typeof STAGES)[keyof typeof STAGES]

/** 合法迁移矩阵 */
export const LEGAL_TRANSITIONS: Record<Stage, Stage[]> = {
  [STAGES.EXECUTE]: [STAGES.IDLE, STAGES.RECOVER],
  [STAGES.IDLE]: [STAGES.RESEARCH],
  [STAGES.IMPLEMENT]: [STAGES.REVIEW],
  [STAGES.PLAN]: [STAGES.IMPLEMENT],
  [STAGES.RECOVER]: [STAGES.IMPLEMENT, STAGES.REVIEW, STAGES.IDLE],
  [STAGES.RESEARCH]: [STAGES.PLAN],
  [STAGES.REVIEW]: [STAGES.EXECUTE, STAGES.IMPLEMENT],
}

/** 阶段元数据 */
export interface StageMetadata {
  allowedActions: string[]
  description: string
  gateRequired: boolean
  name: Stage
}

/** 阶段元数据映射 */
export const STAGE_METADATA: Record<Stage, StageMetadata> = {
  EXECUTE: {
    allowedActions: ['next', 'handoff'],
    description: '执行完成',
    gateRequired: false,
    name: STAGES.EXECUTE,
  },
  IDLE: {
    allowedActions: ['next'],
    description: '初始状态',
    gateRequired: false,
    name: STAGES.IDLE,
  },
  IMPLEMENT: {
    allowedActions: ['next', 'handoff'],
    description: '执行开发任务',
    gateRequired: false,
    name: STAGES.IMPLEMENT,
  },
  PLAN: {
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    description: '制定实现计划',
    gateRequired: true,
    name: STAGES.PLAN,
  },
  RECOVER: {
    allowedActions: ['next', 'handoff'],
    description: '从中断恢复',
    gateRequired: false,
    name: STAGES.RECOVER,
  },
  RESEARCH: {
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    description: '收集需求与分析',
    gateRequired: true,
    name: STAGES.RESEARCH,
  },
  REVIEW: {
    allowedActions: ['next', 'handoff', 'approve', 'reject', 'other'],
    description: '进行代码审查',
    gateRequired: true,
    name: STAGES.REVIEW,
  },
}

/** 验证状态迁移是否合法 */
export function isLegalTransition(from: Stage, to: Stage): boolean {
  const allowedTargets = LEGAL_TRANSITIONS[from]
  return allowedTargets?.includes(to) ?? false
}

/** 获取下一阶段建议 */
export function getNextStage(current: Stage): null | Stage {
  const nextStages = LEGAL_TRANSITIONS[current]
  return nextStages?.[0] ?? null
}

/** 获取阶段元数据 */
export function getStageMetadata(stage: Stage): StageMetadata {
  return STAGE_METADATA[stage] || {
    allowedActions: [],
    description: '未知阶段',
    gateRequired: false,
    name: stage,
  }
}

/** 状态快照 */
export interface StateSnapshot {
  createdAt: string
  lastTransition: null | {
    from: Stage
    reason: string
    timestamp: string
    to: Stage
  }
  sessionId: string
  stage: Stage
  updatedAt: string
}

/** 创建初始状态 */
export function createInitialState(sessionId: string): StateSnapshot {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    lastTransition: null,
    sessionId,
    stage: STAGES.IDLE,
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
    lastTransition: {
      from,
      reason: reason || `从 ${from} 迁移到 ${to}`,
      timestamp: new Date().toISOString(),
      to,
    },
    stage: to,
    updatedAt: new Date().toISOString(),
  }
}
