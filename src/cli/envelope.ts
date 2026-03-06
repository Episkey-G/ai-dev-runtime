/**
 * 统一 CLI 输出 envelope
 * 成功：{ ok: true, data, meta }
 * 失败：{ ok: false, error: { code, message, details }, meta }
 */

import type {ErrorCode} from './error-codes.js'

/** 输出元数据 */
export interface EnvelopeMeta {
  /** 时间戳 ISO 8601 */
  timestamp: string
  /** CLI 版本 */
  version: string
}

/** 成功 envelope */
export interface SuccessEnvelope<T = unknown> {
  data: T
  meta: EnvelopeMeta
  ok: true
}

/** 错误详情 */
export interface ErrorDetail {
  code: ErrorCode
  details?: unknown
  message: string
  recovery?: string
}

/** 失败 envelope */
export interface FailureEnvelope {
  error: ErrorDetail
  meta: EnvelopeMeta
  ok: false
}

export type Envelope<T = unknown> = FailureEnvelope | SuccessEnvelope<T>

/** 构建元数据 */
function buildMeta(): EnvelopeMeta {
  return {
    timestamp: new Date().toISOString(),
    version: getVersion(),
  }
}

/** 获取当前 CLI 版本 */
function getVersion(): string {
  // 运行时从 package.json 读取，此处硬编码为 fallback
  return process.env.AI_DEV_VERSION ?? '0.1.0'
}

/** 创建成功 envelope */
export function success<T>(data: T): SuccessEnvelope<T> {
  return {
    data,
    meta: buildMeta(),
    ok: true,
  }
}

/** 创建失败 envelope */
export function failure(error: ErrorDetail): FailureEnvelope {
  return {
    error,
    meta: buildMeta(),
    ok: false,
  }
}
