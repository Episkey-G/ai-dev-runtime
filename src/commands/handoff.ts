import {Command, Flags} from '@oclif/core'
import * as path from 'node:path'
import * as fs from 'node:fs'

import {success, failure} from '../cli/envelope.js'
import {outputResult} from '../cli/output.js'
import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'

/** Agent 定义 */
export interface Agent {
  id: string
  name: string
  role: 'executor' | 'deepAnalyzer' | 'reviewer'
  capabilities: string[]
}

/** 可用 Agents */
export const AGENTS: Record<string, Agent> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    role: 'executor',
    capabilities: ['code-generation', 'refactoring', 'testing'],
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    role: 'deepAnalyzer',
    capabilities: ['code-review', 'analysis', 'architecture'],
  },
}

/** 上下文数据包 */
export interface ContextPacket {
  sessionId: string
  stage: string
  fromAgent: string
  toAgent: string
  context: {
    recentEvents: string[]
    state: Record<string, unknown>
    pendingTasks: string[]
  }
  timestamp: string
}

/** 状态文件路径 */
function getStatePath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'snapshots', 'state.json')
}

/** 上下文目录路径 */
function getContextPath(workspacePath: string): string {
  return path.join(workspacePath, '.ai-dev', 'context')
}

/** 加载状态 */
function loadState(workspacePath: string): Record<string, unknown> | null {
  const statePath = getStatePath(workspacePath)
  if (!fs.existsSync(statePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
}

/** 保存上下文数据包 */
function saveContextPacket(workspacePath: string, packet: ContextPacket): void {
  const contextPath = getContextPath(workspacePath)
  if (!fs.existsSync(contextPath)) {
    fs.mkdirSync(contextPath, {recursive: true})
  }
  const filename = `handoff-${packet.timestamp}.json`
  fs.writeFileSync(path.join(contextPath, filename), JSON.stringify(packet, null, 2))
}

/** 执行跨 Agent 上下文交接 */
export default class Handoff extends Command {
  static override description = '执行跨 Agent 上下文交接'

  static override flags = {
    json: Flags.boolean({description: '以 JSON envelope 格式输出'}),
    'workspace-path': Flags.string({description: '指定工作区路径', default: '.'}),
    to: Flags.string({
      description: '目标 Agent (claude/codex)',
      default: 'codex',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Handoff)
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
        sessionId: string
        stage: string
        executor?: string
      }

      if (!state) {
        const error = {
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: '状态文件不存在',
          recovery: '请先运行 ai-dev next 初始化状态',
        }
        outputResult(this, failure(error), flags)
        return
      }

      const fromAgent = state.executor || 'claude'
      const toAgent = flags.to

      // 验证目标 Agent
      if (!AGENTS[toAgent]) {
        const error = {
          code: ErrorCodes.CFG_VALIDATION_FAILED,
          message: `未知 Agent: ${toAgent}。可用: ${Object.keys(AGENTS).join(', ')}`,
          recovery: '请指定有效的 Agent (claude 或 codex)',
        }
        outputResult(this, failure(error), flags)
        return
      }

      // 创建上下文数据包
      const packet: ContextPacket = {
        sessionId: state.sessionId,
        stage: state.stage,
        fromAgent,
        toAgent,
        context: {
          recentEvents: [],
          state: state,
          pendingTasks: [],
        },
        timestamp: new Date().toISOString(),
      }

      // 保存上下文数据包
      saveContextPacket(workspacePath, packet)

      // 更新状态
      state.executor = toAgent
      const statePath = getStatePath(workspacePath)
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2))

      outputResult(
        this,
        success({
          message: '上下文交接完成',
          fromAgent,
          toAgent,
          stage: state.stage,
          sessionId: state.sessionId,
          contextPacket: packet.context,
          nextStep: `已切换到 ${AGENTS[toAgent].name}，可继续执行 ai-dev next`,
        }),
        flags,
      )
    } catch (err) {
      const error = {
        code: ErrorCodes.CFG_VALIDATION_FAILED,
        message: `交接失败: ${(err as Error).message}`,
        recovery: RecoveryActions.CFG_VALIDATION_FAILED,
      }
      outputResult(this, failure(error), flags)
    }
  }
}
