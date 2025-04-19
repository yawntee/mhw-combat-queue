<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { type QueueItem, type QueueConfig, type Monster } from '../types'
import { onQueueUpdate, onConfigUpdate, onMonsterUpdate } from '../utils/broadcast'
import { loadConfig } from '../utils/config'
import { db } from '../utils/db'
import DefaultMonsterImage from '../assets/unknown_monster.webp'

const queue = ref<QueueItem[]>([])
const config = ref<QueueConfig>(loadConfig())
const monsters = ref<Monster[]>([])
let scrollDirection = 1
const scrollSpeed = 0.68 // pixels per frame
let isPaused = false
const PAUSE_DURATION = 3000 // 2 seconds
let animationFrameId: number | null = null

const getMonsterImage = computed(() => (content: string): string => {
  const monster = monsters.value.find((m: Monster) => m.name === content)
  return monster?.image || DefaultMonsterImage
})

const startAutoScroll = () => {
  const container = document.querySelector('.queue-container')
  if (!container) return

  const animate = () => {
    if (isPaused) {
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    const isAtBottom = Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight
    const isAtTop = container.scrollTop <= 0

    if (isAtBottom) {
      scrollDirection = -1
      isPaused = true
      setTimeout(() => {
        isPaused = false
      }, PAUSE_DURATION)
    } else if (isAtTop) {
      scrollDirection = 1
      isPaused = true
      setTimeout(() => {
        isPaused = false
      }, PAUSE_DURATION)
    }

    container.scrollTop += scrollSpeed * scrollDirection
    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)
}

const stopAutoScroll = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const resetScroll = () => {
  const container = document.querySelector('.queue-container')
  if (container) {
    container.scrollTop = 0
    scrollDirection = 1
    isPaused = false
  }
}

const handleResize = () => {
  stopAutoScroll()
  resetScroll()
  startAutoScroll()
}

onMounted(async () => {
  document.title = '点怪机 - 队列'
  startAutoScroll()
  window.addEventListener('resize', handleResize)
  onQueueUpdate((newQueue) => {
    queue.value = newQueue
    resetScroll()
  })
  onConfigUpdate((newConfig) => {
    config.value = newConfig
  })
  onMonsterUpdate((newMonsters) => {
    monsters.value = newMonsters
  })
  try {
    monsters.value = await db.getAllMonsters()
  } catch (error) {
    console.error('Failed to load monsters:', error)
  }
})

onUnmounted(() => {
  stopAutoScroll()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <n-flex vertical class="root w-screen h-screen overflow-hidden p-5 box-border">
    <n-marquee class="title">
      {{ config.queueTitle }}
    </n-marquee>
    <div class="queue-container flex-1 overflow-hidden">
      <n-flex vertical>
        <n-flex v-for="(item, index) in queue" :key="index" :wrap="false" justify="space-between" align="center"
          class="p-3 bg-black/70 rounded-lg mb-2.5 text-white">
          <n-flex :wrap="false" align="center" size="small">
            <div class="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full font-bold text-sm">
              {{ index + 1 }}
            </div>
            <n-avatar :src="item.face" round />
            <n-ellipsis class="text-xl font-bold" style="max-width: 100px;">
              {{ item.username }}
            </n-ellipsis>
          </n-flex>
          <n-flex :wrap="false" align="center" size="small">
            <n-image :src="getMonsterImage(item.content)" width="50" height="50" object-fit="cover" />
            <span class="text-xl font-bold text-nowrap">{{ item.content }}</span>
          </n-flex>
        </n-flex>
        <div class="text-center p-2.5 bg-black/70 rounded-2 text-white/70 text-sm mt-2.5 relative z-1">
          <span>{{ queue.length > 0 ? '到底啦~' : '队列为空' }}</span>
        </div>
      </n-flex>
    </div>
  </n-flex>
</template>

<style lang="scss" scoped>
@use "../styles/functions.scss" as *;

.root {
  -webkit-app-region: drag;
  user-select: none;
  pointer-events: none;
}

.queue-container {
  overflow-y: auto;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: v-bind('config.textColor');
  text-shadow: drawTextShadow(1, v-bind('config.strokeColor'));
}
</style>
