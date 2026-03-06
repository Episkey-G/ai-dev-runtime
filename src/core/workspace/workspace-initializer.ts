/**
 * 工作区初始化服务
 * 负责创建 .ai-dev 目录结构与初始文件，确保幂等执行。
 */

import {constants, existsSync} from 'node:fs'
import {access, mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'

import type {ErrorDetail} from '../../cli/envelope.js'

import {ErrorCodes, RecoveryActions} from '../../cli/error-codes.js'
import {writeDefaultConfig} from '../../config/config-writer.js'
import {resolveWorkspacePaths} from './workspace-layout.js'

/** 初始化结果数据（对外 JSON 字段遵循 snake_case 约定） */
export interface InitResult {
  config_path: string
  created_paths: string[]
  duration_ms: number
  next_step: string
  skipped_paths: string[]
}

/** 初始化成功结果 */
interface InitSuccess {
  data: InitResult
  ok: true
}

/** 初始化失败结果 */
interface InitFailure {
  error: ErrorDetail
  ok: false
}

export type InitOutcome = InitFailure | InitSuccess

/** 初始文件内容映射 */
interface FileInit {
  content: string
  path: string
}

/**
 * 初始化工作区
 * 创建 .ai-dev 目录结构与初始文件。已存在的资源标记为 skipped，不覆盖。
 */
export async function initializeWorkspace(baseDir: string): Promise<InitOutcome> {
  const startTime = Date.now()

  if (!baseDir || baseDir.trim() === '') {
    return {
      error: {
        code: ErrorCodes.CFG_PATH_INVALID,
        message: '项目路径不能为空',
        recovery: RecoveryActions[ErrorCodes.CFG_PATH_INVALID],
      },
      ok: false,
    }
  }

  const resolvedBase = resolve(baseDir)

  if (!existsSync(resolvedBase)) {
    return {
      error: {
        code: ErrorCodes.CFG_PATH_INVALID,
        details: {path: resolvedBase},
        message: `项目目录不存在: ${resolvedBase}`,
        recovery: RecoveryActions[ErrorCodes.CFG_PATH_INVALID],
      },
      ok: false,
    }
  }

  try {
    await access(resolvedBase, constants.W_OK)
  } catch {
    return {
      error: {
        code: ErrorCodes.CFG_WRITE_PERMISSION,
        details: {path: resolvedBase},
        message: `目录无写权限: ${resolvedBase}`,
        recovery: RecoveryActions[ErrorCodes.CFG_WRITE_PERMISSION],
      },
      ok: false,
    }
  }

  const paths = resolveWorkspacePaths(resolvedBase)
  const createdPaths: string[] = []
  const skippedPaths: string[] = []

  try {
    for (const dir of paths.directories) {
      if (existsSync(dir)) {
        skippedPaths.push(dir)
      } else {
        await mkdir(dir, {recursive: true}) // eslint-disable-line no-await-in-loop
        createdPaths.push(dir)
      }
    }

    const initialFiles: FileInit[] = [
      {content: '', path: paths.eventsFile},
      {content: JSON.stringify({}, null, 2) + '\n', path: paths.stateFile},
    ]

    for (const file of initialFiles) {
      try {
        await writeFile(file.path, file.content, {encoding: 'utf8', flag: 'wx'}) // eslint-disable-line no-await-in-loop
        createdPaths.push(file.path)
      } catch (error: unknown) {
        const fsError = error as NodeJS.ErrnoException
        if (fsError.code === 'EEXIST') {
          skippedPaths.push(file.path)
        } else {
          throw error
        }
      }
    }

    const configResult = await writeDefaultConfig(paths.configFile)
    if (configResult.status === 'created') {
      createdPaths.push(paths.configFile)
    } else {
      skippedPaths.push(paths.configFile)
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)

    return {
      error: {
        code: ErrorCodes.CFG_INIT_FAILED,
        details: {cause: errMsg},
        message: `工作区初始化失败: ${errMsg}`,
        recovery: RecoveryActions[ErrorCodes.CFG_INIT_FAILED],
      },
      ok: false,
    }
  }

  /* eslint-disable camelcase */
  return {
    data: {
      config_path: paths.configFile,
      created_paths: createdPaths,
      duration_ms: Date.now() - startTime,
      next_step: '执行 ai-dev next 启动首个编排',
      skipped_paths: skippedPaths,
    },
    ok: true,
  }
  /* eslint-enable camelcase */
}
