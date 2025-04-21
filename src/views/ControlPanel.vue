<script setup lang="ts">
import { type Monster, type QueueConfig, type QueueItem } from '@/types'
import { useMessage } from 'naive-ui'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import MonsterModal from '../components/modals/MonsterModal.vue'
import ConfigPanel from '../components/panels/ConfigPanel.vue'
import ConnectionPanel from '../components/panels/ConnectionPanel.vue'
import MonsterPanel from '../components/panels/MonsterPanel.vue'
import QueuePanel from '../components/panels/QueuePanel.vue'
import TestPanel from '../components/panels/TestPanel.vue'
import { broadcastConfig, broadcastMonsters, broadcastQueue } from '../utils/broadcast'
import { loadConfig, saveConfig } from '../utils/config'
import { db } from '../utils/db'
import { truncate } from 'lodash'
import { findBestMatchMonster } from '@/utils/monster'

const $message = useMessage()

const queue = ref<QueueItem[]>([])
const monsters = ref<Monster[]>([])
const config = reactive<QueueConfig>(loadConfig())

// Handle incoming live messages
const handleLiveMessage = async (event: any, data: any) => {
  console.log('handleLiveMessage', data)
  if (data.cmd === 'DANMU_MSG' && data.content.startsWith('点怪')) {
    const content = data.content.slice(2).trim()
    const queueItem: QueueItem = {
      uid: data.uid,
      username: data.username,
      face: data.face,
      guardLevel: data.guardLevel,
      medalLevel: data.medalLevel,
      content: findBestMatchMonster(monsters.value, content)?.name || truncate(content, { length: 8 }),
      timestamp: Date.now()
    }

    if (queueItem.guardLevel >= config.minGuardLevel && queueItem.medalLevel >= config.minMedalLevel) {
      addToQueue(queueItem)
    }
  }
}

const addToQueue = (item: QueueItem) => {
  if (config.allowJump) {
    // 当允许插队时，根据舰长等级排序
    const insertIndex = queue.value.findIndex(queueItem => {
      // 找到第一个舰长等级小于当前用户的项
      if (queueItem.guardLevel < item.guardLevel) {
        return true
      }
      // 如果舰长等级相同，则保持先入队的在前
      if (queueItem.guardLevel === item.guardLevel && queueItem.timestamp > item.timestamp) {
        return true
      }
      return false
    })

    if (insertIndex === -1) {
      queue.value.push(item)
    } else {
      queue.value.splice(insertIndex, 0, item)
    }
  } else {
    // 不允许插队时，直接添加到队尾
    queue.value.push(item)
  }

  // Broadcast queue update
  broadcastQueue(queue.value)
}

// 监听怪物列表变化，同步怪物图片
watch(monsters, () => {
  broadcastMonsters(monsters.value)
}, { deep: true })

// Load monsters on mount
onMounted(async () => {
  window.electron?.live(handleLiveMessage)
  try {
    monsters.value = await db.getAllMonsters()
  } catch (error) {
    $message.error('加载怪物数据失败')
  }
})

onUnmounted(() => {
  window.electron?.unlisten('live', handleLiveMessage)
})

// Monster management functions
const showMonsterModal = ref(false)
const selectedMonster = ref<Monster>()
const editingMonster = reactive({
  name: '',
  aliases: [] as string[],
  image: null as File | null
})

const handleEditMonster = (monster?: Monster) => {
  selectedMonster.value = monster || undefined
  editingMonster.name = monster?.name || ''
  editingMonster.aliases = monster?.aliases || []
  editingMonster.image = null
  showMonsterModal.value = true
}

watch(config, (newConfig) => {
  saveConfig(newConfig)
  broadcastConfig(newConfig)
}, { deep: true })

const handleTestMessage = (data: any) => {
  handleLiveMessage(null, data)
}
</script>

<template>
  <n-flex class="max-h-full h-full p-2 box-border overflow-hidden" :wrap="false" justify="space-evenly">
    <div class="h-full min-w-80">
      <n-scrollbar class="p-r-3">
        <n-flex vertical>
          <ConnectionPanel />
          <ConfigPanel :config="config" />
          <TestPanel @send-test="handleTestMessage" />
        </n-flex>
      </n-scrollbar>
    </div>

    <MonsterPanel v-model:monsters="monsters" @edit="handleEditMonster" />
    <QueuePanel v-model:queue="queue" :monsters="monsters" />
  </n-flex>

  <MonsterModal v-model:show="showMonsterModal" :monsters="monsters" :monster="selectedMonster"
    @update:monsters="monsters = $event" />
</template>

<style scoped>
.state {
  color: #666;
  font-size: 12px;
  white-space: nowrap;

  &::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #666;
  }

  &.connected::before {
    background-color: #00a88b;
  }

  &.connecting::before {
    background-color: #00a88b;
  }

}
</style>
