/**
 * 工作区路径布局定义（SSOT）
 * 所有 .ai-dev 相关路径集中在此处管理。
 */

import {resolve} from 'node:path'

/** 工作区根目录名 */
export const WORKSPACE_DIR = '.ai-dev'

/** 工作区路径集合 */
export interface WorkspacePaths {
  /** 配置文件路径 */
  configFile: string
  /** context 目录 */
  contextDir: string
  /** 按创建顺序排列的目录列表 */
  directories: string[]
  /** events 目录 */
  eventsDir: string
  /** events.jsonl 文件路径 */
  eventsFile: string
  /** 所有初始文件列表 */
  files: string[]
  /** .ai-dev 根目录 */
  root: string
  /** snapshots 目录 */
  snapshotsDir: string
  /** state.json 文件路径 */
  stateFile: string
}

/** 基于项目根目录解析所有工作区路径 */
export function resolveWorkspacePaths(baseDir: string): WorkspacePaths {
  const root = resolve(baseDir, WORKSPACE_DIR)
  const eventsDir = resolve(root, 'events')
  const snapshotsDir = resolve(root, 'snapshots')
  const contextDir = resolve(root, 'context')
  const eventsFile = resolve(eventsDir, 'events.jsonl')
  const stateFile = resolve(snapshotsDir, 'state.json')
  const configFile = resolve(root, 'config.yaml')

  return {
    configFile,
    contextDir,
    directories: [root, eventsDir, snapshotsDir, contextDir],
    eventsDir,
    eventsFile,
    files: [eventsFile, stateFile, configFile],
    root,
    snapshotsDir,
    stateFile,
  }
}
