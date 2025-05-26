import {app, BrowserWindow, ipcMain, screen} from "electron";
import * as path from "node:path";
import started from "electron-squirrel-startup";
import {pollForCookies} from "./utils/cookie";
import {connectWS} from "./utils/ws";
import {toMessageData} from "tiny-bilibili-ws";
import Store from 'electron-store';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Handle second instance launch
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

// Initialize store for window size persistence
const store = new Store<{
  cookie: string;
  queueWindowSize: {
    width: number;
    height: number;
  };
}>();

let mainWindow: BrowserWindow | null = null;
let queueWindow: BrowserWindow | null = null;

function createMainWindow() {
  const scale = screen.getPrimaryDisplay().scaleFactor;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800 * scale,
    height: 600 * scale,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  if (import.meta.env.DEV) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event
  mainWindow.on("closed", () => {
    app.quit();
  });
}

function createQueueWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const savedSize = store.get('queueWindowSize', {
    width: 400,
    height: 600,
  });

  queueWindow = new BrowserWindow({
    x: width,
    y: height,
    ...savedSize,
    titleBarStyle: "hidden",
    transparent: true,
    minimizable: false,
    roundedCorners: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
  });

  // Save window bounds when resized
  queueWindow.on('resize', () => {
    if (queueWindow) {
      store.set('queueWindowSize', {
        width: queueWindow.getBounds().width,
        height: queueWindow.getBounds().height,
      });
    }
  });
  
  if (process.env.NODE_ENV === "development") {
    queueWindow.loadURL("http://localhost:5173/#/queue");
    queueWindow.webContents.openDevTools();
  } else {
    queueWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "/queue" }
    );
  }

  // Handle window close event
  queueWindow.on("closed", () => {
    app.quit();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createMainWindow();
  createQueueWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createQueueWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle("connect", async (event, url, targetCookie, roomId) => {
  let cookies = store.get("cookie") || "";
  let shouldRetry = false;

  try {
    if (cookies) {
      // 如果cookie存在，直接尝试连接
      const live = await connectWS(roomId, cookies);
      setupLiveListener(live, event, roomId);
      return true;
    }
    shouldRetry = true;
  } catch (error) {
    console.error("Connection failed with existing cookies:", error);
    // 连接失败，清除cookie并重试
    store.delete("cookie");
    shouldRetry = true;
  }

  if (shouldRetry) {
    // 重新获取cookie
    const result = await pollForCookies(url, targetCookie);
    if (!result) {
      return false;
    }
    cookies = result;

    try {
      const live = await connectWS(roomId, cookies);
      setupLiveListener(live, event, roomId);
      // 连接成功后保存cookie
      store.set("cookie", cookies);
      return true;
    } catch (error) {
      console.error("Connection failed after getting new cookies:", error);
      store.delete("cookie");
      throw error;
    }
  }
});

// 设置直播监听器的辅助函数
function setupLiveListener(live: any, event: any, roomId: number) {
  live.on("DANMU_MSG", (danmu: any) => {
    const data = toMessageData(danmu);
    const content: string = data.info[1] || "", // 弹幕内容
      uid: number = data.info[2][0] || 0, // 用户ID
      username: string = data.info[2][1] || "未知", // 用户名
      face: string =
        data.info[0][15].user.base.face ||
        "https://i0.hdslb.com/bfs/face/member/noface.jpg", // 用户头像
      guardLevel: number = data.info[3][0] || 0; // 用户大航海等级
    const medalInfo: any = data.info[3] || [];
    const medalLevel: number = medalInfo[3] === roomId ? medalInfo[0] : 0;
    if (import.meta.env.DEV) {
      console.log(data);
    }
    event.sender.send("live", {
      cmd: data.cmd,
      content,
      uid,
      username,
      face,
      guardLevel,
      medalLevel,
    });
  });
}

// Handle queue window toggle
ipcMain.on("toggle-queue-window", (_, visible: boolean) => {
  if (!queueWindow) return;

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  if (visible) {
    // 显示窗口并移动到屏幕中心
    queueWindow.center();
    queueWindow.moveTop();
  } else {
    // 隐藏窗口并移动到屏幕外
    queueWindow.setPosition(width, height);
  }
});
