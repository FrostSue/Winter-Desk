import { contextBridge, ipcRenderer } from "electron";
import type { ScreenEvent, SnowConfig } from "../src/types";

contextBridge.exposeInMainWorld("winterDesk", {
  getTaskbarBounds: () => ipcRenderer.invoke("get-taskbar-bounds"),
  setIgnoreMouseEvents: (ignore: boolean, forward = true) => {
    ipcRenderer.send("set-ignore-mouse-events", ignore, forward);
  },
  onConfigChange: (callback: (config: SnowConfig) => void) => {
    ipcRenderer.on("config-changed", (_event, config) => callback(config));
  },
  onTriggerEvent: (callback: (event: ScreenEvent) => void) => {
    ipcRenderer.on("trigger-event", (_event, eventName) => callback(eventName));
  },
  onToggleDressingRoom: (callback: () => void) => {
    ipcRenderer.on("toggle-dressing-room", () => callback());
  },
  onToggleDecorations: (callback: () => void) => {
    ipcRenderer.on("toggle-decorations", () => callback());
  }
});
