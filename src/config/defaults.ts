/**
 * 零配置默认值
 * 提供初始化时的默认配置结构。
 */

/** 默认配置结构（对外 JSON/YAML 字段遵循 snake_case 约定） */
export interface DefaultConfig {
  gate_policy: {
    default_action: string
    required_stages: string[]
  }
  routing: {
    available_agents: string[]
    default_agent: string
  }
  schema_version: string
}

/** 生成零配置默认值 */
export function getDefaultConfig(): DefaultConfig {
  /* eslint-disable camelcase */
  return {
    gate_policy: {
      default_action: 'prompt',
      required_stages: [],
    },
    routing: {
      available_agents: ['claude'],
      default_agent: 'claude',
    },
    schema_version: '1.0.0',
  }
  /* eslint-enable camelcase */
}
