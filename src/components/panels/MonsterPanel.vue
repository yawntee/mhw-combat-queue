<script setup lang="ts">
import { AddSharp, CreateOutline, DownloadOutline, EllipsisVertical, FolderOpenOutline, TrashOutline } from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'
import pako from 'pako'
import { h } from 'vue'
import { type Monster } from '../../types'
import { db } from '../../utils/db'

const monsters = defineModel<Monster[]>('monsters')

const emit = defineEmits<{
  (e: 'edit', monster?: Monster): void
}>()

const $message = useMessage()

const handleImport = async () => {
  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'JSON Files',
        accept: {
          'application/json': ['.json']
        }
      }],
      multiple: false
    })

    const file = await fileHandle.getFile()
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const decompressed = pako.inflate(uint8Array)
    const text = new TextDecoder().decode(decompressed)
    const importedMonsters = JSON.parse(text)

    // 获取当前所有怪物
    const currentMonsters = await db.getAllMonsters()
    const currentMonsterNames = new Set(currentMonsters.map(m => m.name))

    // 处理导入的怪物数据
    for (const monster of importedMonsters) {
      if (currentMonsterNames.has(monster.name)) {
        // 如果名称已存在，先删除旧的
        await db.removeMonster(monster.name)
      }
      // 添加新的怪物数据
      await db.addMonster({
        ...monster,
        aliases: monster.aliases || []
      })
    }

    // 获取更新后的怪物列表
    const updatedMonsters = await db.getAllMonsters()
    monsters.value = updatedMonsters
    $message.success('怪物数据导入成功')
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      $message.error(`导入失败: ${error.message || error}`)
    }
  }
}

const handleExport = async () => {
  try {
    const monstersData = await db.getAllMonsters()
    const jsonString = JSON.stringify(monstersData, null, 2)
    const uint8Array = new TextEncoder().encode(jsonString)
    const compressed = pako.deflate(uint8Array)
    const blob = new Blob([compressed], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monsters.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    $message.success('导出成功')
  } catch (error) {
    $message.error(`导出失败: ${error}`)
  }
}

const clearAllMonsters = async () => {
  try {
    await db.clearAllMonsters()
    monsters.value = []
    $message.success('已清空所有怪物')
  } catch (error) {
    $message.error(`清空失败: ${error}`)
  }
}

const removeMonster = async (index: number) => {
  const { value: _monsters } = monsters
  if (!_monsters) return
  const monster = _monsters[index]
  try {
    await db.removeMonster(monster.name)
    _monsters.splice(index, 1)
    $message.success('删除成功')
  } catch (error) {
    $message.error(`删除失败: ${error}`)
  }
}

const menuOptions = [
  {
    key: 'import',
    label: '导入',
    icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) })
  },
  {
    key: 'export',
    label: '导出',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
  }
]

const handleDropdownSelect = (key: string) => {
  switch (key) {
    case 'import':
      handleImport()
      break
    case 'export':
      handleExport()
      break
  }
}
</script>

<template>
  <n-card title="怪物管理" class="bg-white rounded-lg shadow" content-style="height: 0; flex: 1;">
    <template #header-extra>
      <n-flex :wrap="false">
        <n-button type="primary" size="small" @click="$emit('edit')">
          <template #icon>
            <n-icon>
              <AddSharp />
            </n-icon>
          </template>
          添加
        </n-button>
        <n-popconfirm @positive-click="clearAllMonsters">
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
        <n-dropdown trigger="hover" :options="menuOptions" @select="handleDropdownSelect">
          <n-button text size="small">
            <template #icon>
              <n-icon>
                <EllipsisVertical />
              </n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </n-flex>
    </template>
    <n-scrollbar class="mt-4" style="hei">
      <n-flex vertical>
        <div v-for="(monster, index) in monsters" :key="index"
          class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-2">
          <n-image :src="monster.image" width="50" height="50" object-fit="cover" />
          <span class="flex-1">{{ monster.name }}</span>
          <n-button type="primary" size="small" @click="$emit('edit', monster)">
            <template #icon>
              <n-icon>
                <CreateOutline />
              </n-icon>
            </template>
          </n-button>
          <n-button type="error" size="small" @click="removeMonster(index)">
            <template #icon>
              <n-icon>
                <TrashOutline />
              </n-icon>
            </template>
          </n-button>
        </div>
      </n-flex>
    </n-scrollbar>
  </n-card>
</template> 