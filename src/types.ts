export interface TaskbarBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  position: "bottom" | "top" | "left" | "right";
}

export interface WindowBounds {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnowConfig {
  intensity: "off" | "light" | "medium" | "heavy" | "blizzard";
  flakeCount: number;
  wind: number;
  minSpeed: number;
  maxSpeed: number;
  accumulateOnTaskbar: boolean;
  accumulateOnWindows: boolean;
}

export interface SnowmanConfig {
  hat: string;
  face: string;
  clothes: string;
  accessory: string;
}

export type OrnamentType =
  | "red-bauble"
  | "gold-bauble"
  | "blue-bauble"
  | "purple-bauble"
  | "wreath"
  | "stocking"
  | "tree"
  | "candy-cane"
  | "gingerbread"
  | "bells"
  | "ribbon"
  | "star"
  | "candle"
  | "snowflake-decor"
  | "gift-box";

export type LightColorTheme = "rainbow" | "warm-white" | "ice-blue" | "candy";

export type ScreenEvent =
  | "snowplough"
  | "snowball-fight"
  | "stop-snowball-fight"
  | "santa"
  | "train"
  | "summon-buddy";

export interface WinterDeskAPI {
  getTaskbarBounds: () => Promise<TaskbarBounds>;
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => void;
  onConfigChange: (callback: (config: SnowConfig) => void) => void;
  onTriggerEvent: (callback: (event: ScreenEvent) => void) => void;
  onToggleDressingRoom: (callback: () => void) => void;
  onToggleDecorations: (callback: () => void) => void;
  onWindowsUpdated: (callback: (windows: WindowBounds[]) => void) => void;
}

declare global {
  interface Window {
    winterDesk: WinterDeskAPI;
  }
}
