/**
 * 配置文件写入服务
 * 负责 .ai-dev/config.yaml 首次写入，已存在则保持不变。
 */

import {lstat, writeFile} from 'node:fs/promises'

import {getDefaultConfig} from './defaults.js'

/** 配置写入结果 */
export interface ConfigWriteResult {
  /** created = 首次创建; kept_existing = 已有文件保持不变 */
  status: 'created' | 'kept_existing'
}

/** 将默认配置序列化为 YAML 格式（简单实现，无需引入 YAML 库） */
function serializeConfigYaml(): string {
  const config = getDefaultConfig()
  const lines: string[] = [
    `# ai-dev 运行时配置`,
    `# 由 ai-dev init 自动生成`,
    ``,
    `schema_version: "${config.schema_version}"`,
    ``,
    `gate_policy:`,
    `  default_action: "${config.gate_policy.default_action}"`,
    `  required_stages: []`,
    ``,
    `routing:`,
    `  default_agent: "${config.routing.default_agent}"`,
    `  available_agents:`,
  ]

  for (const agent of config.routing.available_agents) {
    lines.push(`    - "${agent}"`)
  }

  return lines.join('\n') + '\n'
}

/**
 * 写入默认配置文件
 * 使用 wx flag（exclusive create）确保并发安全：文件已存在时原子失败，不覆盖。
 * 已存在文件为符号链接时抛出错误，防止写入外部路径。
 */
export async function writeDefaultConfig(configPath: string): Promise<ConfigWriteResult> {
  const content = serializeConfigYaml()

  try {
    await writeFile(configPath, content, {encoding: 'utf8', flag: 'wx'})
    return {status: 'created'}
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'EEXIST') {
      const stat = await lstat(configPath)
      if (stat.isSymbolicLink()) {
        throw new Error(`配置文件路径不允许为符号链接: ${configPath}`)
      }

      return {status: 'kept_existing'}
    }

    throw error
  }
}
