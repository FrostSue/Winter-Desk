import path from "node:path";
import { app, BrowserWindow, Menu, nativeImage, type NativeImage, Tray } from "electron";
import type { ScreenEvent, SnowConfig } from "../src/types";

export class TrayManager {
  private tray: Tray | null = null;
  private currentConfig: SnowConfig = {
    intensity: "medium",
    flakeCount: 150,
    wind: 0.5,
    minSpeed: 1,
    maxSpeed: 3,
    accumulateOnTaskbar: true,
    accumulateOnWindows: true
  };

  constructor(private mainWindow: BrowserWindow) {}

  public init(): void {
    const icon = this.createDefaultTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip("WinterDesk - Winter Desktop Companion");
    this.tray.on("click", () => {
      this.tray?.popUpContextMenu();
    });
    this.updateContextMenu();
  }

  private createDefaultTrayIcon(): NativeImage {
    const iconPath = path.join(__dirname, "../assets/tray.png");
    return nativeImage.createFromPath(iconPath);
  }

  public updateContextMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "WinterDesk",
        enabled: false
      },
      { type: "separator" },
      {
        label: "Snowfall",
        submenu: [
          {
            label: "Off",
            type: "radio",
            checked: this.currentConfig.intensity === "off",
            click: () => this.setIntensity("off", 0)
          },
          {
            label: "Light",
            type: "radio",
            checked: this.currentConfig.intensity === "light",
            click: () => this.setIntensity("light", 80)
          },
          {
            label: "Medium",
            type: "radio",
            checked: this.currentConfig.intensity === "medium",
            click: () => this.setIntensity("medium", 180)
          },
          {
            label: "Heavy",
            type: "radio",
            checked: this.currentConfig.intensity === "heavy",
            click: () => this.setIntensity("heavy", 350)
          },
          {
            label: "Blizzard",
            type: "radio",
            checked: this.currentConfig.intensity === "blizzard",
            click: () => this.setIntensity("blizzard", 600)
          }
        ]
      },
      {
        label: "Wind",
        submenu: [
          {
            label: "Calm",
            type: "radio",
            checked: this.currentConfig.wind === 0,
            click: () => this.setWind(0)
          },
          {
            label: "Gentle Breeze (Right)",
            type: "radio",
            checked: this.currentConfig.wind === 0.6,
            click: () => this.setWind(0.6)
          },
          {
            label: "Strong Wind (Right)",
            type: "radio",
            checked: this.currentConfig.wind === 1.8,
            click: () => this.setWind(1.8)
          },
          {
            label: "Gentle Breeze (Left)",
            type: "radio",
            checked: this.currentConfig.wind === -0.6,
            click: () => this.setWind(-0.6)
          },
          {
            label: "Strong Wind (Left)",
            type: "radio",
            checked: this.currentConfig.wind === -1.8,
            click: () => this.setWind(-1.8)
          }
        ]
      },
      {
        label: "Snow Accumulation on Taskbar",
        type: "checkbox",
        checked: this.currentConfig.accumulateOnTaskbar,
        click: (menuItem) => {
          this.currentConfig.accumulateOnTaskbar = menuItem.checked;
          this.notifyConfigChange();
        }
      },
      { type: "separator" },
      {
        label: "Send Snowplough",
        click: () => this.triggerEvent("snowplough")
      },
      {
        label: "Start Snowball Fight",
        click: () => this.triggerEvent("snowball-fight")
      },
      {
        label: "Send Santa Sleigh",
        click: () => this.triggerEvent("santa")
      },
      {
        label: "Send Gift Train",
        click: () => this.triggerEvent("train")
      },
      { type: "separator" },
      {
        label: "Customize Snowman",
        click: () => this.mainWindow.webContents.send("toggle-dressing-room")
      },
      {
        label: "Deck Desktop",
        click: () => this.mainWindow.webContents.send("toggle-decorations")
      },
      { type: "separator" },
      {
        label: "Launch at Windows Startup",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({ openAtLogin: menuItem.checked });
        }
      },
      {
        label: "Quit WinterDesk",
        click: () => app.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setIntensity(intensity: SnowConfig["intensity"], count: number): void {
    this.currentConfig.intensity = intensity;
    this.currentConfig.flakeCount = count;
    this.updateContextMenu();
    this.notifyConfigChange();
  }

  private setWind(wind: number): void {
    this.currentConfig.wind = wind;
    this.updateContextMenu();
    this.notifyConfigChange();
  }

  private triggerEvent(event: ScreenEvent): void {
    this.mainWindow.webContents.send("trigger-event", event);
  }

  private notifyConfigChange(): void {
    this.mainWindow.webContents.send("config-changed", this.currentConfig);
  }

  public getConfig(): SnowConfig {
    return this.currentConfig;
  }
}
