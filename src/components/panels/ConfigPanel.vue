<script setup lang="ts">
import { type QueueConfig } from '../../types'
import { watch } from 'vue'
import { saveConfig } from '../../utils/config'
import { broadcastConfig } from '../../utils/broadcast';

const props = defineProps<{
  config: QueueConfig
}>()

watch(() => props.config, (newConfig) => {
  saveConfig(newConfig)
  broadcastConfig(newConfig)
}, { deep: true })
</script>

<template>
  <n-card title="配置面板" class="bg-white rounded-lg shadow">
    <n-form>
      <n-form-item label="队列标题">
        <n-input v-model:value="config.queueTitle" placeholder="请输入队列标题" />
      </n-form-item>
      <n-form-item label="文字颜色">
        <n-color-picker v-model:value="config.textColor" />
      </n-form-item>
      <n-form-item label="描边颜色">
        <n-color-picker v-model:value="config.strokeColor" />
      </n-form-item>
      <n-form-item label="最低舰长等级">
        <n-input-number v-model:value="config.minGuardLevel" :min="0" class="w-full" />
      </n-form-item>
      <n-form-item label="最低粉丝勋章等级">
        <n-input-number v-model:value="config.minMedalLevel" :min="0" class="w-full" />
      </n-form-item>
      <n-form-item label="允许舰长插队" label-placement="left">
        <n-switch v-model:value="config.allowJump" />
      </n-form-item>
    </n-form>
  </n-card>
</template>