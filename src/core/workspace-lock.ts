/* eslint-disable camelcase */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {ErrorCodes, RecoveryActions} from '../cli/error-codes.js'

export interface LockMetadata {
  host: string
  pid: number
  started_at: string
}

export interface LockOptions {
  allowStaleTakeover?: boolean
  staleMs?: number
}

export interface WorkspaceLock {
  metadata: LockMetadata
  release: () => void
}

const DEFAULT_STALE_MS = 1000 * 60 * 5

export function acquireWorkspaceLock(
  workspacePath: string,
  options: LockOptions = {},
): WorkspaceLock {
  const lockPath = path.join(workspacePath, '.ai-dev', '.lock')
  const metadata: LockMetadata = {
    host: os.hostname(),
    pid: process.pid,
    started_at: new Date().toISOString(),
  }

  ensureLockDirectory(lockPath)

  try {
    createLockFile(lockPath, metadata)
  } catch (error_) {
    if (!isAlreadyExistsError(error_)) {
      throw error_
    }

    const allowStaleTakeover = options.allowStaleTakeover ?? true
    if (!allowStaleTakeover) {
      throwLockConflict('工作区已被其他进程锁定', lockPath)
    }

    const staleMs = options.staleMs ?? DEFAULT_STALE_MS
    const existing = readLockMetadata(lockPath)
    if (!existing || !isStaleLock(existing, staleMs)) {
      throwLockConflict('工作区锁已存在且仍有效', lockPath)
    }

    try {
      fs.unlinkSync(lockPath)
      createLockFile(lockPath, metadata)
    } catch (takeoverError) {
      const details = {
        lockPath,
        reason: (takeoverError as Error).message,
      }
      const error = new Error(JSON.stringify(details))
      error.name = ErrorCodes.LOCK_STALE_TAKEOVER_FAILED
      throw error
    }
  }

  return {
    metadata,
    release() {
      const existing = readLockMetadata(lockPath)
      if (!existing) {
        return
      }

      if (existing.pid !== metadata.pid || existing.host !== metadata.host) {
        return
      }

      fs.unlinkSync(lockPath)
    },
  }
}

function createLockFile(lockPath: string, metadata: LockMetadata): void {
  const descriptor = fs.openSync(lockPath, 'wx')
  try {
    fs.writeFileSync(descriptor, JSON.stringify(metadata, null, 2))
  } finally {
    fs.closeSync(descriptor)
  }
}

function ensureLockDirectory(lockPath: string): void {
  const directory = path.dirname(lockPath)
  if (!fs.existsSync(directory)) {
    throw new Error(ErrorCodes.CFG_FILE_NOT_FOUND)
  }
}

function isAlreadyExistsError(error_: unknown): boolean {
  return (error_ as NodeJS.ErrnoException).code === 'EEXIST'
}

function isProcessAlive(pid: number): boolean {
  if (pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error_) {
    const error = error_ as NodeJS.ErrnoException
    if (error.code === 'ESRCH') {
      return false
    }

    return true
  }
}

function isStaleLock(metadata: LockMetadata, staleMs: number): boolean {
  const createdAt = Date.parse(metadata.started_at)
  if (Number.isNaN(createdAt)) {
    return true
  }

  if (metadata.host === os.hostname() && !isProcessAlive(metadata.pid)) {
    return true
  }

  return Date.now() - createdAt > staleMs
}

function readLockMetadata(lockPath: string): LockMetadata | null {
  if (!fs.existsSync(lockPath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(lockPath, 'utf8')
    const parsed = JSON.parse(raw) as LockMetadata
    if (
      typeof parsed?.host !== 'string' ||
      typeof parsed?.pid !== 'number' ||
      typeof parsed?.started_at !== 'string'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function throwLockConflict(message: string, lockPath: string): never {
  const details = {
    code: ErrorCodes.LOCK_CONFLICT,
    lockPath,
    message,
    recovery: RecoveryActions[ErrorCodes.LOCK_CONFLICT],
  }
  const error = new Error(JSON.stringify(details))
  error.name = ErrorCodes.LOCK_CONFLICT
  throw error
}
