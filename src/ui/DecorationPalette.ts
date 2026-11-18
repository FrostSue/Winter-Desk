import type { DecorationManager } from "../decorations/DecorationManager";
import type { OrnamentType } from "../decorations/Ornament";

export class DecorationPalette {
  private container: HTMLElement;
  private manager: DecorationManager;
  private isOpen = false;

  private items: { id: OrnamentType | "lights"; label: string; icon: string }[] = [
    { id: "red-bauble", label: "Red Bauble", icon: "🔴" },
    { id: "gold-bauble", label: "Gold Bauble", icon: "🟡" },
    { id: "blue-bauble", label: "Blue Bauble", icon: "🔵" },
    { id: "wreath", label: "Wreath", icon: "🌿" },
    { id: "stocking", label: "Stocking", icon: "🧦" },
    { id: "tree", label: "Mini Tree", icon: "🎄" },
    { id: "candy-cane", label: "Candy Cane", icon: "🍭" },
    { id: "gingerbread", label: "Gingerbread", icon: "🍪" },
    { id: "lights", label: "Fairy Lights", icon: "✨" }
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
      top: "60px",
      right: "60px",
      width: "340px",
      maxHeight: "520px",
      background: "rgba(20, 26, 38, 0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 17px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span>🎀</span> Deck Your Desktop
        </h2>
        <button id="close-palette-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>

      <div style="font-size: 12px; color: rgba(255,255,255,0.65); margin-bottom: 14px; line-height: 1.4;">
        Click an item to place it on screen. Drag it anywhere or right-click on it to remove!
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px;">
        ${this.items
          .map(
            (item) => `
          <button
            class="place-item-btn"
            data-id="${item.id}"
            style="
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 10px;
              padding: 10px 6px;
              color: #fff;
              cursor: pointer;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              transition: all 0.15s ease;
            "
          >
            <span style="font-size: 22px;">${item.icon}</span>
            <span style="font-size: 11px; font-weight: 500; text-align: center;">${item.label}</span>
          </button>
        `
          )
          .join("")}
      </div>

      <button
        id="clear-decorations-btn"
        style="
          background: rgba(239, 68, 68, 0.18);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
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
