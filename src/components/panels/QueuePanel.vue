<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { TrashOutline, EyeOutline, EyeOffOutline } from '@vicons/ionicons5'
import DefaultMonsterImage from '../../assets/unknown_monster.webp'
import type { Monster } from '../../types'
import { type QueueItem } from '../../types'
import { broadcastQueue } from '../../utils/broadcast'

const props = defineProps<{
  monsters: Monster[]
  queue: QueueItem[]
}>()

const emit = defineEmits<{
  (e: 'update:queue', queue: QueueItem[]): void
}>()

const QUEUE_KEY = 'mhw_queue'
const isQueueVisible = ref(false)

const getMonsterImage = computed(() => (content: string): string => {
  const monster = props.monsters.find((m: Monster) => m.name === content)
  return monster?.image || DefaultMonsterImage
})

const removeFromQueue = (index: number) => {
  const newQueue = [...props.queue]
  newQueue.splice(index, 1)
  emit('update:queue', newQueue)
  broadcastQueue(newQueue)
}

const clearQueue = () => {
  emit('update:queue', [])
  broadcastQueue([])
}

const toggleQueueVisibility = () => {
  isQueueVisible.value = !isQueueVisible.value
  window.electron?.toggleQueueWindow(isQueueVisible.value)
}

// 监听队列变化并保存
watch(() => props.queue, (newQueue) => {
  if (newQueue.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue))
  } else {
    localStorage.removeItem(QUEUE_KEY)
  }
}, { deep: true })

// 加载保存的队列
onMounted(() => {
  const savedQueue = localStorage.getItem(QUEUE_KEY)
  if (savedQueue) {
    try {
      const parsedQueue = JSON.parse(savedQueue)
      emit('update:queue', parsedQueue)
      broadcastQueue(parsedQueue)
    } catch (error) {
      console.error('Failed to load saved queue:', error)
      localStorage.removeItem(QUEUE_KEY)
    }
  }
})
</script>

<template>
  <n-card title="当前队列" class="bg-white rounded-lg shadow" content-style="height: 0; flex: 1;">
    <template #header-extra>
      <n-flex :wrap="false" align="center" size="small">
        <n-button type="primary" size="small" @click="toggleQueueVisibility">
          <template #icon>
            <n-icon>
              <EyeOffOutline v-if="isQueueVisible" />
              <EyeOutline v-else />
            </n-icon>
          </template>
          {{ isQueueVisible ? '隐藏' : '显示' }}
        </n-button>
        <n-popconfirm @positive-click="clearQueue">
          <template #trigger>
            <n-button type="error" size="small">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              清空
            </n-button>
          </template>
          确认清空？
        </n-popconfirm>
      </n-flex>
    </template>
    <n-scrollbar>
      <n-flex vertical>
        <n-flex v-for="(item, index) in queue" :key="item.uid" :wrap="false" justify="space-between" align="center"
          class="p-3 bg-gray-50 rounded-lg mb-2 transition-all hover:bg-gray-100 hover:translate-x-1">
          <n-flex :wrap="false" align="center" size="small">
            <n-avatar :src="item.face" round />
            <n-ellipsis class="text-xl font-bold" style="max-width: 100px;">
              {{ item.username }}
            </n-ellipsis>
          </n-flex>
          <n-flex :wrap="false" align="center" size="small">
            <span class="text-xl font-bold text-nowrap">{{ item.content }}</span>
            <n-image :src="getMonsterImage(item.content)" width="50" height="50" object-fit="cover" />
          </n-flex>
          <n-button type="error" size="small" @click="removeFromQueue(index)">
            移除
          </n-button>
        </n-flex>
      </n-flex>
    </n-scrollbar>
  </n-card>
</template>