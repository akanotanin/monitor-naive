<script setup lang="ts">
// 因为 NProgress 不支持双叠加，所以直接二开了一个组件（
import { useThemeVars } from 'naive-ui'
import { computed } from 'vue'
import { formatBytes } from '@/utils/helper'

export interface TrafficProgressProps {
  /** 上传流量（字节） */
  upload: number
  /** 下载流量（字节） */
  download: number
  /** 流量限制（字节），0 表示不显示 */
  trafficLimit: number
  /** 流量限制类型：up | down | min | max | sum */
  trafficLimitType: 'up' | 'down' | 'min' | 'max' | 'sum'
  /** 上传流量颜色（默认使用 success 色） */
  uploadColor?: string
  /** 下载流量颜色（默认使用 info 色） */
  downloadColor?: string
  /** 单色模式下的颜色 */
  singleColor?: string
  /** 进度条高度 */
  height?: number | string
  /** 是否显示指示器 */
  showIndicator?: boolean
}

const props = withDefaults(defineProps<TrafficProgressProps>(), {
  uploadColor: undefined,
  downloadColor: undefined,
  singleColor: undefined,
  height: undefined,
  showIndicator: false,
})

// 获取 Naive UI 主题变量
const themeVars = useThemeVars()

// 是否显示流量进度条
const showProgress = computed(() => props.trafficLimit > 0)

// 根据类型计算已用流量
const usedTraffic = computed(() => {
  const { upload, download, trafficLimitType } = props
  switch (trafficLimitType) {
    case 'up':
      return upload
    case 'down':
      return download
    case 'min':
      return Math.min(upload, download)
    case 'max':
      return Math.max(upload, download)
    case 'sum':
      return upload + download
    default:
      return upload + download
  }
})

// 计算总百分比
const totalPercentage = computed(() => {
  if (props.trafficLimit <= 0)
    return 0
  return Math.min((usedTraffic.value / props.trafficLimit) * 100, 100)
})

// 上传流量百分比（相对于总限制）
const uploadPercentage = computed(() => {
  if (props.trafficLimit <= 0)
    return 0
  return Math.min((props.upload / props.trafficLimit) * 100, 100)
})

// 下载流量百分比（相对于总限制）
const downloadPercentage = computed(() => {
  if (props.trafficLimit <= 0)
    return 0
  return Math.min((props.download / props.trafficLimit) * 100, 100)
})

// 是否为双颜色模式
const isDualColorMode = computed(() => props.trafficLimitType === 'sum')

// 进度条样式
const progressHeight = computed(() => {
  if (props.height === undefined)
    return undefined
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})

// 颜色计算：优先使用传入的颜色，否则使用主题变量
const resolvedUploadColor = computed(() => props.uploadColor || themeVars.value.successColor)
const resolvedDownloadColor = computed(() => props.downloadColor || themeVars.value.infoColor)

// 单色模式下的颜色：根据流量类型自动选择
const resolvedSingleColor = computed(() => {
  // 如果指定了单色，优先使用
  if (props.singleColor)
    return props.singleColor

  // 根据流量类型选择颜色
  switch (props.trafficLimitType) {
    case 'up':
      // up 类型使用上传颜色
      return resolvedUploadColor.value
    case 'down':
      // down 类型使用下载颜色
      return resolvedDownloadColor.value
    case 'min':
      // min 类型使用较小值对应的颜色
      return props.upload <= props.download ? resolvedUploadColor.value : resolvedDownloadColor.value
    case 'max':
      // max 类型使用较大值对应的颜色
      return props.upload >= props.download ? resolvedUploadColor.value : resolvedDownloadColor.value
    case 'sum':
    default:
      // sum 类型走双颜色模式，这里作为 fallback
      return resolvedUploadColor.value
  }
})

// Rail 背景颜色
const railColor = computed(() => themeVars.value.progressRailColor)
</script>

<template>
  <div class="traffic-progress">
    <!-- 双颜色模式：上传和下载分开显示 -->
    <div v-if="isDualColorMode" class="traffic-progress__rail" :style="{ height: progressHeight, backgroundColor: railColor }">
      <!-- 上传流量部分 -->
      <div
        class="traffic-progress__fill"
        :style="{
          width: `${uploadPercentage}%`,
          backgroundColor: resolvedUploadColor,
        }"
      />
      <!-- 下载流量部分（末端有圆角） -->
      <div
        class="traffic-progress__fill traffic-progress__fill--last"
        :style="{
          width: `${downloadPercentage}%`,
          backgroundColor: resolvedDownloadColor,
        }"
      />
    </div>

    <!-- 单色模式 -->
    <div v-else class="traffic-progress__rail" :style="{ height: progressHeight, backgroundColor: railColor }">
      <div
        class="traffic-progress__fill traffic-progress__fill--last"
        :style="{
          width: `${totalPercentage}%`,
          backgroundColor: resolvedSingleColor,
        }"
      />
    </div>

    <!-- 指示器 -->
    <div v-if="showIndicator && showProgress" class="traffic-progress__indicator">
      <span>{{ totalPercentage.toFixed(1) }}%</span>
      <span class="traffic-progress__indicator-detail">
        {{ formatBytes(usedTraffic) }} / {{ formatBytes(trafficLimit) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.traffic-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  &__rail {
    position: relative;
    display: flex;
    overflow: hidden;
    height: 8px;
    border-radius: 5px;
    transition: background-color 0.3s;
  }

  &__fill {
    position: relative;
    height: 100%;
    transition:
      max-width 0.2s,
      width 0.2s,
      background-color 0.3s;

    // 末端圆角
    &--last {
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }

  &__indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--n-text-color-2);

    &-detail {
      color: var(--n-text-color-3);
    }
  }
}
</style>
