<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  initialRoomId?: string
}>()

defineEmits<{
  (e: 'connect', roomId: string): void
}>()

const $message = useMessage()
const roomId = ref(props.initialRoomId || '')
const isConnecting = ref(false)
const isConnected = ref(false)
const LAST_ROOM_KEY = 'last_room_id'

const validateNoSpace = (value: string): boolean => {
  return /^\S*$/.test(value)
}

const connectToRoom = async () => {
  let room = roomId.value.trim()
  if (room) {
    try {
      const url = new URL(room)
      room = url.pathname.split('/').pop() || room
    } finally { }
    isConnecting.value = true
    window.electron?.connect('https://passport.bilibili.com/login', 'SESSDATA', Number(room))
      .then(res => {
        if (res) {
          isConnected.value = true
          localStorage.setItem(LAST_ROOM_KEY, roomId.value)
          $message.success('连接成功')
        } else {
          isConnected.value = false
          $message.error('取消连接')
        }
      })
      .catch((error: any) => {
        isConnected.value = false
        $message.error(`连接失败: ${error}`)
      })
      .finally(() => {
        isConnecting.value = false
      })
  }
}

// 检查是否有保存的房间号，如果有则自动连接
onMounted(() => {
  const lastRoom = localStorage.getItem(LAST_ROOM_KEY)
  if (lastRoom) {
    roomId.value = lastRoom
    connectToRoom()
  }
})
</script>

<template>
  <n-flex vertical>
    <n-flex :wrap="false">
      <n-input v-model:value="roomId" placeholder="直播间链接或房间号" :disabled="isConnecting" :allow-input="validateNoSpace" />
      <n-button type="primary" @click="connectToRoom" :disabled="isConnecting || !roomId.trim()">
        连接
      </n-button>
      <n-flex class="state" :class="{ 'connected': isConnected, 'connecting': isConnecting }" :wrap="false"
        align="center" size="small">
        {{ isConnecting ? '连接中...' : isConnected ? '已连接' : '未连接' }}
      </n-flex>
    </n-flex>
    <div class="text-sm text-gray-500 text-center">
      使用窗口采集标题为《点怪机 - 队列》的窗口即可
    </div>
  </n-flex>
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