import type {
  Client,
  GetRecordsParams,
  LoadRecordsResult,
  LoadType,
  MeInfo,
  MethodMeta,
  NodeStatus,
  PingRecordsResult,
  PublicInfo,
  RecentStatusResult,
  VersionInfo,
} from '@/types/komari'
import { dispatch } from '@/monitor/transport'

// ==================== 类型定义 ====================

/** 调用错误，保留 Komari RPC 的错误码语义（-32601 表示能力缺失） */
export class RpcError extends Error {
  code: number
  data?: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'RpcError'
    this.code = code
    this.data = data
  }
}

/** 调用入口配置，保留以便主题配置里的连接模式切换 */
interface RpcClientOptions {
  baseUrl?: string
  timeout?: number
  /** 是否使用实时连接，默认 false */
  useWebSocket?: boolean
}

/**
 * 调用客户端
 * 极简探针没有 JSON-RPC 端点，方法名统一交给 @/monitor/transport 翻译成 REST / WebSocket 调用
 */
export class RpcClient {
  private useWebSocket: boolean

  constructor(options: RpcClientOptions = {}) {
    this.useWebSocket = options.useWebSocket ?? false
  }

  async call<T>(method: string, params?: Record<string, unknown> | unknown[]): Promise<T> {
    const normalized = (Array.isArray(params) ? {} : params ?? {}) as Record<string, unknown>
    try {
      return await dispatch(method, normalized) as T
    }
    catch (error) {
      if (error instanceof RpcError)
        throw error
      // 能力缺失按 JSON-RPC 的「方法未找到」上报，主题侧不会把它当成网络故障
      throw new RpcError(-32601, error instanceof Error ? error.message : String(error))
    }
  }

  /** 切换连接模式：真实连接由 @/monitor/transport 负责，此处仅记录偏好 */
  setTransport(useWebSocket: boolean): void {
    this.useWebSocket = useWebSocket
  }

  getTransport(): boolean {
    return this.useWebSocket
  }

  close(): void {}

  getWsReadyState(): number {
    return WebSocket.CLOSED
  }
}

// ==================== 主题调用的方法封装 ====================

/**
 * 兼容原 Komari 主题的方法封装
 * 方法名与参数保持原样，由传输层翻译到极简探针接口
 */
export class KomariRpc {
  private client: RpcClient

  constructor(options: RpcClientOptions = {}) {
    this.client = new RpcClient(options)
  }

  /** 获取底层调用客户端 */
  getClient(): RpcClient {
    return this.client
  }

  /** 获取所有可用方法（极简探针未实现，返回空列表） */
  async getMethods(): Promise<string[]> {
    return []
  }

  async getHelp(method: string): Promise<MethodMeta> {
    throw new RpcError(-32601, `极简探针不提供此能力：${method}`)
  }

  /** 健康检查 */
  async ping(): Promise<string> {
    return this.client.call<string>('rpc.ping')
  }

  async getVersion(): Promise<string> {
    const info = await this.getBackendVersion()
    return info.version
  }

  /** 获取所有节点信息（以 uuid 为键） */
  async getNodes(): Promise<Record<string, Client>>
  async getNodes(uuid: string): Promise<Client>
  async getNodes(uuid?: string): Promise<Client | Record<string, Client>> {
    const clients = await this.client.call<Record<string, Client>>('common:getNodes')
    return uuid ? clients[uuid]! : clients
  }

  /** 获取所有节点最新状态（以 uuid 为键） */
  async getNodesLatestStatus(uuid?: string, uuids?: string[]): Promise<Record<string, NodeStatus>> {
    const params = uuid ? { uuid } : uuids ? { uuids } : undefined
    return this.client.call<Record<string, NodeStatus>>('common:getNodesLatestStatus', params)
  }

  /** 获取节点最近状态记录 */
  async getNodeRecentStatus(uuid: string): Promise<RecentStatusResult> {
    return this.client.call<RecentStatusResult>('common:getNodeRecentStatus', { uuid })
  }

  /** 获取站点公开信息 */
  async getPublicInfo(): Promise<PublicInfo> {
    return this.client.call<PublicInfo>('public:getPublicSettings')
  }

  async getMe(): Promise<MeInfo> {
    return this.client.call<MeInfo>('public:getMe')
  }

  /** 获取后端版本 */
  async getBackendVersion(): Promise<VersionInfo> {
    return this.client.call<VersionInfo>('public:getVersion')
  }

  /** 获取历史记录（通用入口） */
  async getRecords<T>(params: GetRecordsParams): Promise<T> {
    return this.client.call<T>('common:getRecords', { ...params })
  }

  /** 获取负载记录，records 以 uuid 为键 */
  async getLoadRecords(uuid: string, hours = 4, loadType: LoadType = 'all', maxCount = 4000): Promise<LoadRecordsResult> {
    return this.client.call<LoadRecordsResult>('common:getRecords', {
      type: 'load',
      uuid,
      hours,
      load_type: loadType,
      maxCount,
    })
  }

  /** 获取延迟记录 */
  async getPingRecords(uuid: string, hours = 4): Promise<PingRecordsResult> {
    return this.client.call<PingRecordsResult>('public:getPingRecords', {
      uuid,
      hours: String(hours),
    })
  }

  close(): void {
    this.client.close()
  }
}

// ==================== 单例 ====================

let sharedRpc: KomariRpc | null = null

/** 获取共享实例 */
export function getSharedRpc(): KomariRpc {
  if (!sharedRpc)
    sharedRpc = new KomariRpc()
  return sharedRpc
}

/** 重置共享实例 */
export function resetSharedRpc(): void {
  if (sharedRpc) {
    sharedRpc.close()
    sharedRpc = null
  }
}
