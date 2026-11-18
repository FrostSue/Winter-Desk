import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import { TrayManager } from "./tray";
import type { TaskbarBounds } from "../src/types";

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function calculateTaskbarBounds(): TaskbarBounds {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds, workArea } = primaryDisplay;

  if (workArea.y > bounds.y) {
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: workArea.y - bounds.y,
      position: "top"
    };
  }

  if (workArea.height < bounds.height && workArea.y === bounds.y) {
    return {
      x: bounds.x,
      y: workArea.y + workArea.height,
      width: bounds.width,
      height: bounds.height - workArea.height,
      position: "bottom"
    };
  }

  if (workArea.x > bounds.x) {
    return {
      x: bounds.x,
      y: bounds.y,
      width: workArea.x - bounds.x,
      height: bounds.height,
      position: "left"
    };
  }

  if (workArea.width < bounds.width && workArea.x === bounds.x) {
    return {
      x: workArea.x + workArea.width,
      y: bounds.y,
      width: bounds.width - workArea.width,
      height: bounds.height,
      position: "right"
    };
  }

  return {
    x: bounds.x,
    y: bounds.height - 48,
    width: bounds.width,
    height: 48,
    position: "bottom"
  };
}

function getWindowScriptPath(): string {
  const devPath = path.join(__dirname, "../scripts/get_windows.ps1");
  const packagedPath = path.join(app.getAppPath(), "scripts/get_windows.ps1");
  const resourcePath = path.join(process.resourcesPath, "app/scripts/get_windows.ps1");

  if (fs.existsSync(devPath)) return devPath;
  if (fs.existsSync(packagedPath)) return packagedPath;
  return resourcePath;
}

function createMainWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds } = primaryDisplay;

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: true,
    backgroundColor: "#00000000",
    icon: path.join(__dirname, "../assets/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.webContents.on("console-message", (_event, _level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  trayManager = new TrayManager(mainWindow);
  trayManager.init();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("get-taskbar-bounds", () => {
  return calculateTaskbarBounds();
});

ipcMain.on("set-ignore-mouse-events", (_event, ignore: boolean, forward = true) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward });
  }
});

let windowPollTimer: NodeJS.Timeout | null = null;

function pollOpenWindows(): void {
  const scriptPath = getWindowScriptPath();
  exec(
    `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}"`,
    { windowsHide: true },
    (err, stdout) => {
      if (!err && stdout && mainWindow && !mainWindow.isDestroyed()) {
        try {
          const windows = JSON.parse(stdout.trim());
          mainWindow.webContents.send("windows-updated", windows);
        } catch {
        }
      }
    }
  );
}

app.whenReady().then(() => {
  createMainWindow();
  pollOpenWindows();
  windowPollTimer = setInterval(pollOpenWindows, 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (windowPollTimer) clearInterval(windowPollTimer);
  if (process.platform !== "darwin") {
    app.quit();
  }
});
