import { KeepLiveWS } from "tiny-bilibili-ws";

let live: KeepLiveWS | null = null;

export function connectWS(roomId: number, cookies: string) {
  return new Promise<KeepLiveWS>((resolve, reject) => {
    live?.close();
    const uid = cookies.match(/DedeUserID=(\d+)/)?.[1];
    if (!uid) {
      reject(new Error("未找到uid"));
      return;
    }
    live = new KeepLiveWS(roomId, {
      headers: {
        Cookie: cookies,
      },
      uid: Number(uid),
    });

    live.runWhenConnected(() => {
      console.log(`正在监听 ${roomId}`); // 连接成功后才会触发
      resolve(live!);
    });

    live.on("error", (e: unknown) => {
      console.error("错误: ", e);
      reject(e);
    });

    live.on("close", () => {
      console.log(`退出监听 ${roomId}`);
    });
  });
}