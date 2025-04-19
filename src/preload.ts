// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

const api = {
  connect: (url: string, targetCookie: string, roomId: number) =>
    ipcRenderer.invoke("connect", url, targetCookie, roomId),
  live: (
    callback: (
      event: IpcRendererEvent,
      data: {
        cmd: string;
        content: string;
        uid: number;
        username: string;
        face: string;
        guardLevel: number;
        medalLevel: number;
      }
    ) => void
  ) => {
    ipcRenderer.on("live", callback);
  },
  unlisten: (
    event: string,
    callback: (event: IpcRendererEvent, ...args: any[]) => void
  ) => {
    ipcRenderer.removeListener(event, callback);
  },
  toggleQueueWindow: (visible: boolean) => {
    ipcRenderer.send("toggle-queue-window", visible);
  }
};

contextBridge.exposeInMainWorld("electron", api);

export type ElectronAPI = typeof api;
