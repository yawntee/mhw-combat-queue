<script setup lang="ts">
import { reactive } from 'vue'

const emit = defineEmits<{
  (e: 'sendTest', data: any): void
}>()

const testData = reactive({
  username: '测试用户',
  content: '锁刃',
  guardLevel: 0,
  medalLevel: 0,
})

const sendTestDanmu = () => {
  const _testData = {
    cmd: 'DANMU_MSG',
    content: `点怪 ${testData.content}`,
    uid: Math.floor(Math.random() * 1000000),
    username: testData.username,
    face: 'https://i0.hdslb.com/bfs/face/member/noface.jpg',
    guardLevel: testData.guardLevel,
    medalLevel: testData.medalLevel
  }
  emit('sendTest', _testData)
}
</script>

<template>
  <n-card title="测试面板" class="bg-white rounded-lg shadow">
    <n-form>
      <n-form-item label="用户名">
        <n-input v-model:value="testData.username" />
      </n-form-item>
      <n-form-item label="怪物名">
        <n-input v-model:value="testData.content" />
      </n-form-item>
      <n-form-item label="舰长等级">
        <n-input-number v-model:value="testData.guardLevel" :min="0" />
      </n-form-item>
      <n-form-item label="粉丝勋章等级">
        <n-input-number v-model:value="testData.medalLevel" :min="0" />
      </n-form-item>
    </n-form>
    <n-button type="primary" @click="sendTestDanmu">发送测试弹幕</n-button>
  </n-card>
</template> 