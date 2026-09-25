<script setup lang="ts">
import { NSpin, useOsTheme } from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const osTheme = useOsTheme()

const isDark = computed(() => {
  if (appStore.themeMode === 'auto') {
    return osTheme.value === 'dark'
  }
  return appStore.themeMode === 'dark'
})
</script>

<template>
  <div
    class="loading-cover flex h-screen w-screen items-center left-0 top-0 justify-center absolute z-20 backdrop-blur-sm"
    :class="isDark ? 'bg-black/50' : 'bg-white/80'"
  >
    <NSpin>
      <template #description>
        Loading...
      </template>
    </NSpin>
  </div>
</template>
