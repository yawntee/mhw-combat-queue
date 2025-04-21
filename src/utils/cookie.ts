import { BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

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
        const cookies = await window.webContents.session.cookies.get({url});
        
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

/**
 * 将Cookie字符串保存到本地文件
 * @param cookies Cookie字符串
 * @param filePath 文件保存路径，默认为用户数据目录下的cookies.txt
 * @returns Promise<void>
 */
export async function saveCookiesToFile(
  cookies: string,
  filePath?: string
): Promise<void> {
  const targetPath = filePath || 'cookies.txt';

  // 确保目录存在
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(targetPath, cookies, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 从本地文件读取Cookie字符串
 * @param filePath 文件路径，默认为用户数据目录下的cookies.txt
 * @returns Promise<string> 返回读取到的Cookie字符串
 */
export async function loadCookiesFromFile(
  filePath?: string
): Promise<string> {
  const targetPath = filePath || 'cookies.txt';

  if (!fs.existsSync(targetPath)) {
    return '';
  }

  return new Promise((resolve, reject) => {
    fs.readFile(targetPath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * 清除保存的Cookie文件
 * @param filePath 文件路径，默认为用户数据目录下的cookies.txt
 * @returns Promise<void>
 */
export async function clearCookies(filePath?: string): Promise<void> {
  const targetPath = filePath || 'cookies.txt';
  
  if (!fs.existsSync(targetPath)) {
    return;
  }

  return new Promise((resolve, reject) => {
    fs.unlink(targetPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}