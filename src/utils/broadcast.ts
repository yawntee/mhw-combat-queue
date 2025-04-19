import { cloneDeep } from 'lodash'
import type { Monster, QueueConfig, QueueItem } from '../types'

const QUEUE_CHANNEL = 'mhw-queue-channel'
const CONFIG_CHANNEL = 'mhw-config-channel'
const MONSTER_CHANNEL = 'mhw-monster-channel'

export const queueChannel = new BroadcastChannel(QUEUE_CHANNEL)
export const configChannel = new BroadcastChannel(CONFIG_CHANNEL)
export const monsterChannel = new BroadcastChannel(MONSTER_CHANNEL)

export const broadcastQueue = (queue: QueueItem[]) => {
  try {
    queueChannel.postMessage({ type: 'update', data: cloneDeep(queue) })
  } catch (error) {
    console.error('Failed to broadcast queue:', error, cloneDeep(queue))
  }
}

export const broadcastConfig = (config: QueueConfig) => {
  try {
    configChannel.postMessage({ type: 'update', data: cloneDeep(config) })
  } catch (error) {
    console.error('Failed to broadcast config:', error, cloneDeep(config))
  }
}

export const broadcastMonsters = (monsters: Monster[]) => {
  try {
    monsterChannel.postMessage({ type: 'update', data: cloneDeep(monsters) })
  } catch (error) {
    console.error('Failed to broadcast monsters:', error, cloneDeep(monsters))
  }
}

export const onQueueUpdate = (callback: (queue: QueueItem[]) => void) => {
  queueChannel.onmessage = (event) => {
    if (event.data.type === 'update') {
      callback(event.data.data)
    }
  }
}

export const onConfigUpdate = (callback: (config: QueueConfig) => void) => {
  configChannel.onmessage = (event) => {
    if (event.data.type === 'update') {
      callback(event.data.data)
    }
  }
}

export const onMonsterUpdate = (callback: (monsters: Monster[]) => void) => {
  monsterChannel.onmessage = (event) => {
    if (event.data.type === 'update') {
      callback(event.data.data)
    }
  }
}