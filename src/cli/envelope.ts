/**
 * 统一 CLI 输出 envelope
 * 成功：{ ok: true, data, meta }
 * 失败：{ ok: false, error: { code, message, details }, meta }
 */

import type {ErrorCode} from './error-codes.js'

/** 输出元数据 */
export interface EnvelopeMeta {
  /** CLI 版本 */
  version: string
  /** 时间戳 ISO 8601 */
  timestamp: string
}

/** 成功 envelope */
export interface SuccessEnvelope<T = unknown> {
  ok: true
  data: T
  meta: EnvelopeMeta
}

/** 错误详情 */
export interface ErrorDetail {
  code: ErrorCode
  message: string
  details?: unknown
  recovery?: string
}

/** 失败 envelope */
export interface FailureEnvelope {
  ok: false
  error: ErrorDetail
  meta: EnvelopeMeta
}

export type Envelope<T = unknown> = SuccessEnvelope<T> | FailureEnvelope

/** 构建元数据 */
function buildMeta(): EnvelopeMeta {
  return {
    version: getVersion(),
    timestamp: new Date().toISOString(),
  }
}

/** 获取当前 CLI 版本 */
function getVersion(): string {
  // 运行时从 package.json 读取，此处硬编码为 fallback
  return process.env['AI_DEV_VERSION'] ?? '0.1.0'
}

/** 创建成功 envelope */
export function success<T>(data: T): SuccessEnvelope<T> {
  return {
    ok: true,
    data,
    meta: buildMeta(),
  }
}

/** 创建失败 envelope */
export function failure(error: ErrorDetail): FailureEnvelope {
  return {
    ok: false,
    error,
    meta: buildMeta(),
  }
}
