/**
 * Workspace 初始化模块
 * 负责创建 .ai-dev/ 目录结构和默认配置
 */

import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json') as {version: string}

/** 默认工作区配置 */
export interface WorkspaceConfig {
  defaults: {
    deepAnalyzer: string
    executor: string
    gatePolicy: string[]
  }
  paths: {
    context: string
    events: string
    snapshots: string
  }
  version: string
  workspaceVersion: string
}

/** 初始化结果 */
export interface InitResult {
  created: string[]
  idempotent: boolean
  initialized: boolean
  workspacePath: string
}

/** 默认工作区配置 */
export function getDefaultConfig(_workspacePath: string): WorkspaceConfig {
  return {
    defaults: {
      deepAnalyzer: 'codex',
      executor: 'claude',
      gatePolicy: [
        'prd_freeze',
        'architecture_freeze',
        'high_complexity',
        'release',
        'fix_loop',
      ],
    },
    paths: {
      context: '.ai-dev/context',
      events: '.ai-dev/events',
      snapshots: '.ai-dev/snapshots',
    },
    version: pkg.version,
    workspaceVersion: '1.0.0',
  }
}

/** 检查路径是否合法 */
export function isValidPath(p: string): boolean {
  try {
    const normalized = path.normalize(p)
    // 检查是否包含非法字符
    if (normalized.includes('..') || normalized.includes('~')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/** 初始化工作区 */
export async function initializeWorkspace(
  targetPath: string,
  force = false,
): Promise<InitResult> {
  const workspacePath = path.join(targetPath, '.ai-dev')

  // 1. 验证路径
  if (!isValidPath(targetPath)) {
    throw new Error('CFG_WORKSPACE_PATH_INVALID')
  }

  try {
    // 2. 检查是否已存在
    const exists = fs.existsSync(workspacePath)
    if (exists && !force) {
      return {
        created: [],
        idempotent: true,
        initialized: false,
        workspacePath,
      }
    }

    const created: string[] = []

    // 3. 创建目录结构
    const dirs = ['events', 'snapshots', 'context', 'locks']

    for (const dir of dirs) {
      const dirPath = path.join(workspacePath, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true})
        created.push(dir)
      }
    }

    // 4. 创建初始配置文件
    const configPath = path.join(workspacePath, 'config.json')
    if (!fs.existsSync(configPath) || force) {
      const config = getDefaultConfig(targetPath)
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      created.push('config.json')
    }

    // 5. 创建初始事件文件
    const eventsPath = path.join(workspacePath, 'events', 'events.jsonl')
    if (!fs.existsSync(eventsPath)) {
      fs.writeFileSync(eventsPath, '')
      created.push('events.jsonl')
    }

    // 6. 创建初始快照
    const statePath = path.join(workspacePath, 'snapshots', 'state.json')
    if (!fs.existsSync(statePath)) {
      const initialState = {
        createdAt: new Date().toISOString(),
        lastEventChecksum: null,
        lastEventId: null,
        lastTransition: null,
        sessionId: null,
        stage: 'IDLE',
      }
      fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2))
      created.push('state.json')
    }

    // 7. 创建 workspace 元数据
    const metaPath = path.join(workspacePath, 'meta.json')
    if (!fs.existsSync(metaPath) || force) {
      const meta = {
        initializedAt: new Date().toISOString(),
        version: pkg.version,
      }
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
      created.push('meta.json')
    }

    return {
      created,
      idempotent: false,
      initialized: true,
      workspacePath,
    }
  } catch (error) {
    const {code} = (error as NodeJS.ErrnoException)
    if (code === 'EACCES' || code === 'EPERM') {
      throw new Error('CFG_WORKSPACE_PERMISSION')
    }

    throw error
  }
}
