import path from "node:path";
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
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

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

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
