import themeManifest from '../../theme.json'
import { request } from './transport'

/**
 * 主题配置层
 * 极简探针把主题配置存在 Hub 里（GET/PUT /api/themes/<short>/config），
 * 后台「主题 → 主题设置」写入，前台只读。
 */

/** theme.json 中声明的配置项 */
export interface ThemeConfigField {
  type: 'title' | 'boolean' | 'text' | 'select' | 'number' | 'string'
  key?: string
  label?: string
  default?: unknown
  help?: string
  options?: Array<{ value: string, label: string }>
  min?: number
  max?: number
}

interface ThemeManifest {
  name: string
  short: string
  version: string
  description: string
  author: string
  url: string
  config?: ThemeConfigField[]
}

export const manifest = themeManifest as ThemeManifest

/** 主题包名，用于拼配置接口路径 */
export const THEME_SHORT = manifest.short

/** theme.json 里声明的默认值 */
export function defaultConfig(): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of manifest.config ?? []) {
    if (field.type === 'title' || !field.key)
      continue
    values[field.key] = field.default
  }
  return values
}

/**
 * 按 theme.json 过滤服务端返回的配置
 * 只保留声明过的键，避免后台残留的旧配置把主题带偏
 */
export function sanitizeConfig(saved: unknown): Record<string, unknown> {
  const values = { ...defaultConfig() }
  if (!saved || typeof saved !== 'object')
    return values
  const record = saved as Record<string, unknown>
  for (const field of manifest.config ?? []) {
    if (field.type === 'title' || !field.key)
      continue
    const value = record[field.key]
    if (value === undefined)
      continue
    if (field.type === 'boolean' && typeof value !== 'boolean')
      continue
    if (field.type === 'number' && typeof value !== 'number')
      continue
    if ((field.type === 'string' || field.type === 'text' || field.type === 'select') && typeof value !== 'string')
      continue
    values[field.key] = value
  }
  return values
}

/** 读取 Hub 上保存的主题配置（匿名可读） */
export async function loadConfig(): Promise<Record<string, unknown>> {
  try {
    const saved = await request<Record<string, unknown>>(`/themes/${THEME_SHORT}/config`)
    return sanitizeConfig(saved)
  }
  catch (error) {
    console.warn('[theme] 读取主题配置失败，改用默认值', error)
    return defaultConfig()
  }
}
