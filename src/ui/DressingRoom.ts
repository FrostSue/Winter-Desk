import type { Snowman } from "../characters/Snowman";
import type { SnowmanConfig } from "../types";

export class DressingRoomModal {
  private container: HTMLElement;
  private snowman: Snowman;
  private isOpen = false;

  private hatOptions = [
    { id: "top-hat", label: "Top Hat", icon: "🎩" },
    { id: "santa-hat", label: "Santa Hat", icon: "🎅" },
    { id: "none", label: "None", icon: "❄️" }
  ];

  private faceOptions = [
    { id: "smile", label: "Classic Smile", icon: "😊" },
    { id: "wink", label: "Playful Wink", icon: "😉" },
    { id: "sunglasses", label: "Cool Shades", icon: "😎" }
  ];

  private clothesOptions = [
    { id: "red-scarf", label: "Red Scarf", icon: "🧣" },
    { id: "bow-tie", label: "Bow Tie", icon: "🎀" },
    { id: "none", label: "None", icon: "❄️" }
  ];

  private accessoryOptions = [
    { id: "broom", label: "Snow Broom", icon: "🧹" },
    { id: "candy-cane", label: "Candy Cane", icon: "🦯" },
    { id: "none", label: "None", icon: "❄️" }
  ];

  constructor(snowman: Snowman) {
    this.snowman = snowman;
    this.container = document.createElement("div");
    this.container.id = "dressing-room-modal";
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
    window.winterDesk.setIgnoreMouseEvents(false);
  }

  public close(): void {
    this.isOpen = false;
    this.container.style.display = "none";
    window.winterDesk.setIgnoreMouseEvents(true, true);
  }

  private applyStyles(): void {
    Object.assign(this.container.style, {
      display: "none",
      position: "fixed",
      bottom: "80px",
      right: "60px",
      width: "360px",
      maxHeight: "520px",
      background: "rgba(25, 30, 45, 0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
      color: "#ffffff",
      flexDirection: "column",
      padding: "20px",
      zIndex: "1000",
      pointerEvents: "auto",
      overflowY: "auto"
    });

    this.container.addEventListener("mouseenter", () => {
      window.winterDesk.setIgnoreMouseEvents(false);
    });
    this.container.addEventListener("mouseleave", () => {
      if (!this.isOpen) {
        window.winterDesk.setIgnoreMouseEvents(true, true);
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 600; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px;">
          <span>⛄</span> Snowman Wardrobe
        </h2>
        <button id="close-modal-btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${this.buildSection("Headwear", "hat", this.hatOptions, this.snowman.config.hat)}
        ${this.buildSection("Expression", "face", this.faceOptions, this.snowman.config.face)}
        ${this.buildSection("Attire", "clothes", this.clothesOptions, this.snowman.config.clothes)}
        ${this.buildSection("Accessories", "accessory", this.accessoryOptions, this.snowman.config.accessory)}
      </div>
    `;

    const closeBtn = this.container.querySelector("#close-modal-btn");
    closeBtn?.addEventListener("click", () => this.close());

    this.container.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const category = target.getAttribute("data-category") as keyof SnowmanConfig;
        const value = target.getAttribute("data-value") as string;
        if (category && value) {
          this.snowman.config[category] = value;
          this.render();
        }
      });
    });
  }

  private buildSection(
    title: string,
    category: string,
    options: { id: string; label: string; icon: string }[],
    currentVal: string
  ): string {
    return `
      <div>
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.6); margin-bottom: 8px; font-weight: 600;">
          ${title}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          ${options
            .map(
              (opt) => `
            <button
              class="option-btn"
              data-category="${category}"
              data-value="${opt.id}"
              style="
                background: ${currentVal === opt.id ? "rgba(70, 130, 240, 0.45)" : "rgba(255, 255, 255, 0.08)"};
                border: 1px solid ${currentVal === opt.id ? "rgba(100, 160, 255, 0.8)" : "rgba(255, 255, 255, 0.1)"};
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
              <span style="font-size: 20px;">${opt.icon}</span>
              <span style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;">${opt.label}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }
}
