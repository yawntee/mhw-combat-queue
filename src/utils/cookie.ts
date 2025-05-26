import {BrowserWindow} from 'electron';

/**
 * 打开一个窗口并轮询指定Cookie，当目标Cookie存在时返回所有Cookie
 * @param url 目标URL
 * @param targetCookieName 目标Cookie名称
 * @param pollingIntervalMs 轮询间隔时间，默认1000ms
 * @returns Promise<string> 返回Cookie字符串，格式为HTTP Header格式
 */
export async function pollForCookies(
  url: string,
  targetCookieName: string,
  pollingIntervalMs = 1000
) {
  return new Promise<string | false>(async (resolve, reject) => {
    // 创建新窗口
    const window = new BrowserWindow({
      width: 1536,
      height: 864,
      title: '登录',
    });

    // 加载目标URL
    window.loadURL(url);

    if (import.meta.env.DEV) {
      window.webContents.openDevTools();
    }

    let pollingInterval: NodeJS.Timeout;

    // 检查Cookie的函数
    const checkCookies = async () => {
      try {
        // 获取所有cookies
        const cookies = await window.webContents.session.cookies.get({url: window.webContents.getURL()});
        
        // 检查目标cookie是否存在
        const targetCookieExists = cookies.some(cookie => cookie.name === targetCookieName);
        
        if (targetCookieExists) {
          // 停止轮询
          clearInterval(pollingInterval);
          
          // 将cookies转换为HTTP header格式
          const cookieHeader = cookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
          
          // 关闭窗口
          window.close();
          
          resolve(cookieHeader);
        }
      } catch (error) {
        clearInterval(pollingInterval);
        window.close();
        reject(error);
      }
    };

    // 清除cookie
    await window.webContents.session.cookies.remove(url, targetCookieName);

    // 开始轮询
    pollingInterval = setInterval(checkCookies, pollingIntervalMs);

    // 设置超时处理（可选，这里设置为5分钟）
    const timeout = setTimeout(() => {
      clearInterval(pollingInterval);
      window.close();
      reject(new Error('Cookie polling timeout'));
    }, 5 * 60 * 1000);

    // 处理窗口关闭事件
    window.on('closed', () => {
      clearInterval(pollingInterval);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}