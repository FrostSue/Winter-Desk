import type { DecorationManager } from "../decorations/DecorationManager";
import type { OrnamentType, LightColorTheme, ScreenEvent } from "../types";

export class DecorationPalette {
  private container: HTMLElement;
  private manager: DecorationManager;
  private isOpen = false;
  public onTriggerEvent?: (event: ScreenEvent) => void;

  private items: { id: OrnamentType | "lights"; label: string; icon: string }[] = [
    { id: "red-bauble", label: "Red Bauble", icon: "🔴" },
    { id: "gold-bauble", label: "Gold Bauble", icon: "🟡" },
    { id: "blue-bauble", label: "Ice Bauble", icon: "🔵" },
    { id: "purple-bauble", label: "Purple Bauble", icon: "🟣" },
    { id: "wreath", label: "Wreath", icon: "🌿" },
    { id: "stocking", label: "Stocking", icon: "🧦" },
    { id: "tree", label: "Mini Tree", icon: "🎄" },
    { id: "candy-cane", label: "Candy Cane", icon: "🍭" },
    { id: "gingerbread", label: "Gingerbread", icon: "🍪" },
    { id: "bells", label: "Bells", icon: "🔔" },
    { id: "ribbon", label: "Ribbon Bow", icon: "🎀" },
    { id: "star", label: "Star", icon: "⭐" },
    { id: "candle", label: "Candle", icon: "🕯️" },
    { id: "snowflake-decor", label: "Snowflake", icon: "❄️" },
    { id: "gift-box", label: "Gift Box", icon: "🎁" },
    { id: "lights", label: "Garland", icon: "✨" }
  ];

  constructor(manager: DecorationManager) {
    this.manager = manager;
    this.container = document.createElement("div");
    this.container.id = "decoration-palette";
    this.applyStyles();
    this.render();
    document.body.appendChild(this.container);
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    this.isOpen = true;
    this.container.style.display = "flex";
    this.render();
    window.winterDesk?.setIgnoreMouseEvents(false);
  }

  public close(): void {
    this.isOpen = false;
    this.container.style.display = "none";
    window.winterDesk?.setIgnoreMouseEvents(true, true);
  }

  private applyStyles(): void {
    Object.assign(this.container.style, {
      display: "none",
      position: "fixed",
      top: "50px",
      right: "24px",
      width: "360px",
      maxHeight: "580px",
      background: "rgba(18, 24, 38, 0.94)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRadius: "18px",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      boxShadow: "0 20px 48px rgba(0, 0, 0, 0.55)",
      color: "#ffffff",
      flexDirection: "column",
      padding: "20px",
      zIndex: "1000",
      pointerEvents: "auto",
      overflowY: "auto"
    });

    this.container.addEventListener("mouseenter", () => {
      window.winterDesk?.setIgnoreMouseEvents(false);
    });
    this.container.addEventListener("mouseleave", () => {
      if (!this.isOpen) {
        window.winterDesk?.setIgnoreMouseEvents(true, true);
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span>🎀</span> Deck Your Desktop
        </h2>
        <button id="close-palette-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>

      <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 12px; line-height: 1.4;">
        Click an item to place it. Drag anywhere on screen, drag lights wire to adjust height, right-click to delete.
      </div>

      <div style="font-size: 12px; font-weight: 600; color: #90caf9; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        <span>✨</span> Fairy Lights Style & Height
      </div>
      <div style="display: flex; gap: 6px; margin-bottom: 12px;">
        <button class="light-theme-btn" data-theme="rainbow" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 11px; cursor: pointer;">🌈 Rainbow</button>
        <button class="light-theme-btn" data-theme="warm-white" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 11px; cursor: pointer;">✨ Warm</button>
        <button class="light-theme-btn" data-theme="ice-blue" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 11px; cursor: pointer;">❄️ Ice</button>
        <button class="light-theme-btn" data-theme="candy" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 11px; cursor: pointer;">🎄 Candy</button>
      </div>

      <div style="font-size: 12px; font-weight: 600; color: #a5d6a7; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        <span>🎁</span> Festive Ornaments
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px;">
        ${this.items
          .map(
            (item) => `
          <button
            class="place-item-btn"
            data-id="${item.id}"
            style="
              background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 8px;
              padding: 8px 4px;
              color: #fff;
              cursor: pointer;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 3px;
              transition: all 0.15s ease;
            "
          >
            <span style="font-size: 20px;">${item.icon}</span>
            <span style="font-size: 10px; font-weight: 500; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 68px;">${item.label}</span>
          </button>
        `
          )
          .join("")}
      </div>

      <div style="display: flex; gap: 6px; margin-bottom: 10px;">
        <button
          id="send-train-palette-btn"
          style="
            flex: 1;
            background: rgba(239, 68, 68, 0.22);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #fca5a5;
            padding: 8px;
            border-radius: 8px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
          "
        >
          🚂 Gift Train
        </button>
        <button
          id="send-plough-palette-btn"
          style="
            flex: 1;
            background: rgba(245, 158, 11, 0.22);
            border: 1px solid rgba(245, 158, 11, 0.4);
            color: #fde68a;
            padding: 8px;
            border-radius: 8px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
          "
        >
          🚜 Snowplough
        </button>
      </div>

      <button
        id="clear-decorations-btn"
        style="
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        "
      >
        <span>🧹</span> Clear All Ornaments
      </button>
    `;

    this.container.querySelector("#close-palette-btn")?.addEventListener("click", () => this.close());

    this.container.querySelector("#clear-decorations-btn")?.addEventListener("click", () => {
      this.manager.clearOrnaments();
    });

    this.container.querySelector("#send-train-palette-btn")?.addEventListener("click", () => {
      if (this.onTriggerEvent) this.onTriggerEvent("train");
    });

    this.container.querySelector("#send-plough-palette-btn")?.addEventListener("click", () => {
      if (this.onTriggerEvent) this.onTriggerEvent("snowplough");
    });

    this.container.querySelectorAll(".light-theme-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const theme = (e.currentTarget as HTMLElement).getAttribute("data-theme") as LightColorTheme;
        if (theme) {
          this.manager.setLightsTheme(theme);
        }
      });
    });

    this.container.querySelectorAll(".place-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
        if (!id) return;

        const centerX = window.innerWidth / 2 + (Math.random() * 240 - 120);
        const centerY = window.innerHeight * 0.35 + (Math.random() * 120 - 60);

        if (id === "lights") {
          this.manager.addLights(centerX - 140, centerY, centerX + 140, centerY);
        } else {
          this.manager.addOrnament(centerX, centerY, id as OrnamentType);
        }
      });
    });
  }
}
