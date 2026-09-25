<script setup lang="ts">
import { NLayoutFooter, NText } from 'naive-ui'
import { computed } from 'vue'
import { useGlassSurface } from '@/composables/useGlassSurface'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { glassSurfaceStyle, isGlassEnabled } = useGlassSurface()

// 计算页面容器的样式
const containerStyle = computed(() =>
  appStore.fullWidth
    ? {}
    : { maxWidth: appStore.maxPageWidth, marginInline: 'auto' },
)

// 是否显示备案信息
const showIcp = computed(() => appStore.icpEnabled && appStore.icpNumber)
const showPolice = computed(() => appStore.policeEnabled && appStore.policeNumber)
// 页脚只在需要展示备案信息时出现；未启用备案时不渲染，不留空位
const showFiling = computed(() => showIcp.value || showPolice.value)
</script>

<template>
  <NLayoutFooter
    v-if="showFiling"
    class="px-4 py-4 w-full"
    :class="{ 'glass-surface-enabled glass-footer-enabled': isGlassEnabled }"
    :style="glassSurfaceStyle"
  >
    <div
      class="flex flex-wrap gap-2 items-center justify-center w-full"
      :style="containerStyle"
    >
      <!-- 备案信息区域 -->
      <div v-if="showFiling" class="flex flex-wrap gap-2 items-center">
        <!-- ICP 备案 -->
        <a
          v-if="showIcp"
          :href="appStore.icpUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-decoration-none transition-opacity hover:opacity-70"
        >
          <NText :depth="3" class="text-xs">
            {{ appStore.icpNumber }}
          </NText>
        </a>

        <!-- 分隔符 -->
        <span v-if="showIcp && showPolice" class="opacity-50">
          <NText :depth="3" class="text-xs">|</NText>
        </span>

        <!-- 公安备案 -->
        <template v-if="showPolice">
          <a
            v-if="appStore.policeUrl"
            :href="appStore.policeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-decoration-none transition-opacity hover:opacity-70"
          >
            <NText :depth="3" class="text-xs">
              {{ appStore.policeNumber }}
            </NText>
          </a>
          <NText v-else :depth="3" class="text-xs">
            {{ appStore.policeNumber }}
          </NText>
        </template>
      </div>
    </div>
  </NLayoutFooter>
</template>
