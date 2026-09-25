import type { DialogApi, LoadingBarApi, MessageApi, ModalApi, NotificationApi } from 'naive-ui'

// 构建时注入的全局常量
declare const __BUILD_VERSION__: string
declare const __BUILD_GIT_HASH__: string

declare global {
  interface Window {
    $message: MessageApi
    $dialog: DialogApi
    $notification: NotificationApi
    $loadingBar: LoadingBarApi
    $modal: ModalApi
  }
}
