<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useMessage, type UploadFileInfo } from 'naive-ui'
import { type Monster } from '../../types'
import { db } from '../../utils/db'
import { imageToBase64, base64ToImage } from '../../utils/image'
import { AddSharp } from '@vicons/ionicons5'
import { toRaw } from 'vue'

const props = defineProps<{
  monsters: Monster[]
  monster?: Monster
}>()

const emit = defineEmits<{
  (e: 'update:show', show: boolean): void
  (e: 'update:monsters', monsters: Monster[]): void
}>()

const show = defineModel<boolean>('show')

const $message = useMessage()

const editingMonster = reactive({
  name: '',
  aliases: [] as string[],
  image: null as File | null
})

const handleUpdateImage = async ({ file }: { file: UploadFileInfo }) => {
  if (file.file) {
    editingMonster.image = file.file
  }
  return false
}

const saveMonster = async () => {
  if (!editingMonster.name.trim()) {
    $message.error('请输入怪物名称')
    return
  }
  if (!props.monster && props.monsters.some(m => m.name === editingMonster.name)) {
    $message.error('怪物名称已存在')
    return
  }

  try {
    let imageData: string | null = null
    if (editingMonster.image) {
      const base64 = await imageToBase64(editingMonster.image)
      imageData = base64ToImage(base64, editingMonster.image.type)
    } else if (props.monster) {
      imageData = props.monster.image
    } else {
      $message.error('请上传怪物图片')
      return
    }

    const monster: Monster = {
      name: editingMonster.name,
      image: imageData,
      aliases: toRaw(editingMonster.aliases)
    }

    if (props.monster) {
      // 如果是编辑模式，先删除旧的怪物
      await db.removeMonster(props.monster.name)
    }
    // 添加新的怪物
    await db.addMonster(monster)

    const updatedMonsters = await db.getAllMonsters()
    emit('update:monsters', updatedMonsters)
    $message.success(props.monster ? '更新成功' : '添加成功')
    emit('update:show', false)
  } catch (error) {
    console.error(error)
    $message.error(`${props.monster ? '更新' : '添加'}失败: ${error}`)
  }
}

// Reset form when modal is shown
watch(show, (newVal) => {
  if (newVal) {
    editingMonster.name = props.monster?.name || ''
    editingMonster.aliases = props.monster?.aliases || []
    editingMonster.image = null
  }
})
</script>

<template>
  <n-modal v-model:show="show" preset="dialog" :title="monster ? '编辑怪物' : '添加怪物'"
    @update:show="(val: boolean) => emit('update:show', val)">
    <n-form>
      <n-form-item label="怪物名称">
        <n-input v-model:value="editingMonster.name" placeholder="请输入怪物名称" />
      </n-form-item>
      <n-form-item label="怪物别名">
        <n-dynamic-tags v-model:value="editingMonster.aliases" />
      </n-form-item>
      <n-form-item label="怪物图片">
        <n-upload accept="image/*" list-type="image-card" :max="1" :custom-request="handleUpdateImage">
          <n-upload-dragger>
            <div class="flex flex-col items-center justify-center">
              <n-icon size="24">
                <AddSharp />
              </n-icon>
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>
      <n-flex justify="end">
        <n-button type="primary" @click="saveMonster">{{ monster ? '保存' : '添加' }}</n-button>
      </n-flex>
    </n-form>
  </n-modal>
</template>