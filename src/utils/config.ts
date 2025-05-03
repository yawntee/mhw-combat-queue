import { type QueueConfig } from "../types";

const CONFIG_KEY = "queue_config";

export const defaultQueueConfig: QueueConfig = {
  minGuardLevel: 0,
  minMedalLevel: 0,
  allowJump: false,
  queueTitle: "发送 点怪<怪物名> 点怪",
  textColor: "#000000",
  strokeColor: "#ffffff",
  backgroundColor: "#00000024",
};

export function loadConfig(): QueueConfig {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error("Failed to parse saved config:", e);
    }
  }
  return defaultQueueConfig;
}

export function saveConfig(config: QueueConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
