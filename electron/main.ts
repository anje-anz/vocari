import { app, BrowserWindow, ipcMain, shell, type WebContents } from 'electron';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { LivePersistedState } from '../src/lib/live/types';
import { getAudioOutputs } from './audio';
import { isShuttingDown, markShuttingDown } from './lifecycle';
import {
  loadState,
  patchState,
  removeAccount,
  upsertAccount,
} from './store';
import { getSystemVoices, speakSystem, stopAllTts, stopForSender } from './tts';
import {
  connectChat,
  disconnectChat,
  getChatStatus,
  loginTwitch,
  setTwitchSender,
} from './twitch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;
let allowQuit = false;
let closePromptOpen = false;

const SHUTDOWN_BUDGET_MS = 8000;

function sendToRenderer(channel: string, payload?: unknown) {
  const contents = win?.webContents;
  if (!contents || contents.isDestroyed()) return;
  try {
    if (payload === undefined) contents.send(channel);
    else contents.send(channel, payload);
  } catch {
    // finestra già chiusa
  }
}

function requestCloseConfirm() {
  if (allowQuit || isShuttingDown()) return;
  if (!win || win.isDestroyed()) {
    void runSafeShutdown();
    return;
  }
  const contents = win.webContents;
  if (contents.isDestroyed() || contents.isCrashed()) {
    void runSafeShutdown(contents);
    return;
  }
  if (closePromptOpen) {
    win.show();
    win.focus();
    return;
  }
  closePromptOpen = true;
  sendToRenderer('app:close-requested');
}

async function runSafeShutdown(sender?: WebContents) {
  if (allowQuit) {
    app.quit();
    return;
  }
  markShuttingDown();

  const work = async () => {
    stopAllTts();
    const target = sender && !sender.isDestroyed() ? sender : win?.webContents;
    if (target && !target.isDestroyed()) {
      try {
        target.send('tts:state', 'end');
      } catch {
        // ignore
      }
    }
    setTwitchSender(null);
    disconnectChat();
  };

  await Promise.race([
    work(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, SHUTDOWN_BUDGET_MS);
    }),
  ]);

  allowQuit = true;
  closePromptOpen = false;
  if (win && !win.isDestroyed()) win.close();
  app.quit();
}

function publicState(): LivePersistedState {
  const state = loadState();
  if (!state.twitchClientId) {
    state.twitchClientId = (process.env.VOCARI_TWITCH_CLIENT_ID ?? '').trim();
  }
  return state;
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    width: 1280,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  setTwitchSender(win.webContents);

  win.on('close', (event) => {
    if (allowQuit) return;
    event.preventDefault();
    requestCloseConfirm();
  });

  win.on('closed', () => {
    if (win?.webContents) setTwitchSender(null);
    win = null;
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function registerIpc() {
  ipcMain.on('window:minimize', () => win?.minimize());
  ipcMain.on('window:maximize', () =>
    win?.isMaximized() ? win.unmaximize() : win?.maximize()
  );
  ipcMain.on('window:close', () => {
    if (!win || win.isDestroyed()) {
      requestCloseConfirm();
      return;
    }
    win.close();
  });

  ipcMain.on('app:cancel-close', () => {
    if (isShuttingDown()) return;
    closePromptOpen = false;
  });

  ipcMain.handle('app:confirm-quit', async (event) => {
    await runSafeShutdown(event.sender);
    return true;
  });

  ipcMain.handle(
    'tts:system-speak',
    async (
      event,
      payload: {
        text: string;
        voiceId?: string;
        rate?: number;
        pitch?: number;
        volume?: number;
        outputId?: string;
      }
    ) => {
      const senderId = event.sender.id;
      await speakSystem(
        senderId,
        payload.text,
        payload.voiceId,
        payload.rate,
        payload.pitch,
        payload.volume,
        payload.outputId,
        (state) => event.sender.send('tts:state', state),
        (progress) => event.sender.send('tts:progress', progress)
      );
      return true;
    }
  );

  ipcMain.handle('tts:system-stop', async (event) => {
    const stopped = stopForSender(event.sender.id);
    event.sender.send('tts:state', 'end');
    return stopped;
  });

  ipcMain.handle('tts:get-system-voices', async () => {
    try {
      return await getSystemVoices();
    } catch (err) {
      console.error('Errore getSystemVoices IPC:', err);
      return [];
    }
  });

  ipcMain.handle('audio:outputs', async () => {
    try {
      return await getAudioOutputs();
    } catch {
      return [{ id: 'default', name: 'Uscita predefinita di Windows' }];
    }
  });

  ipcMain.handle('live:get-state', async () => publicState());

  ipcMain.handle('live:set-state', async (_event, patch: Partial<LivePersistedState>) => {
    return patchState(patch);
  });

  ipcMain.handle('twitch:login', async (_event, clientId?: string) => {
    if (isShuttingDown()) {
      return {
        ok: false as const,
        error: 'Chiusura in corso',
        state: publicState(),
      };
    }
    try {
      if (clientId?.trim()) patchState({ twitchClientId: clientId.trim() });
      const account = await loginTwitch(clientId);
      return { ok: true as const, account, state: publicState() };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Login Twitch fallito',
        state: publicState(),
      };
    }
  });

  ipcMain.handle('twitch:logout', async (_event, accountId: string) => {
    const connected = getChatStatus();
    if (connected.accountId === accountId) disconnectChat();
    return removeAccount(accountId);
  });

  ipcMain.handle('twitch:connect', async (_event, accountId: string) => {
    if (isShuttingDown()) {
      return { ok: false as const, status: getChatStatus(), error: 'Chiusura in corso' };
    }
    try {
      const status = await connectChat(accountId);
      return { ok: true as const, status };
    } catch (err) {
      return {
        ok: false as const,
        status: getChatStatus(),
        error: err instanceof Error ? err.message : 'Connessione Twitch fallita',
      };
    }
  });

  ipcMain.handle('twitch:disconnect', async () => disconnectChat());
  ipcMain.handle('twitch:status', async () => getChatStatus());

  ipcMain.handle('live:add-custom-platform', async (_event, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) throw new Error('Nome piattaforma vuoto');
    const state = loadState();
    const platform = { id: `custom-${randomUUID().slice(0, 8)}`, label: trimmed };
    state.customPlatforms = [...state.customPlatforms, platform];
    return patchState({ customPlatforms: state.customPlatforms });
  });

  ipcMain.handle(
    'live:add-custom-account',
    async (_event, payload: { platformId: string; name: string }) => {
      const name = payload.name.trim();
      if (!name) throw new Error('Nome account vuoto');
      const account = {
        id: randomUUID(),
        platform: payload.platformId,
        displayName: name,
        kind: 'custom' as const,
      };
      return { account, state: upsertAccount(account) };
    }
  );

  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    if (!/^https?:\/\//i.test(url)) return false;
    await shell.openExternal(url);
    return true;
  });
}

app.on('before-quit', (event) => {
  if (allowQuit) return;
  event.preventDefault();
  if (isShuttingDown()) return;
  requestCloseConfirm();
});

app.on('window-all-closed', () => {
  setTwitchSender(null);
  if (!isShuttingDown()) disconnectChat();
  if (process.platform !== 'darwin') {
    if (allowQuit) {
      app.quit();
      win = null;
      return;
    }
    requestCloseConfirm();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(() => {
  registerIpc();
  createWindow();
});
