import { SnowEngine } from "./snow/SnowEngine";
import { Snowman } from "./characters/Snowman";
import { SnowballBuilder } from "./characters/SnowballBuilder";
import { DressingRoomModal } from "./ui/DressingRoom";
import { DecorationPalette } from "./ui/DecorationPalette";
import { EventManager } from "./events/EventManager";
import { DecorationManager } from "./decorations/DecorationManager";
import type { TaskbarBounds } from "./types";

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById("snow-canvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Missing #snow-canvas element");
  }

  const defaultTaskbar: TaskbarBounds = {
    x: 0,
    y: window.innerHeight - 48,
    width: window.innerWidth,
    height: 48,
    position: "bottom"
  };

  let taskbar = defaultTaskbar;
  if (window.winterDesk?.getTaskbarBounds) {
    taskbar = await window.winterDesk.getTaskbarBounds();
  }

  const snowEngine = new SnowEngine(canvas);
  snowEngine.setTaskbar(taskbar);
  snowEngine.start();

  const snowman = new Snowman(window.innerWidth * 0.75, taskbar);
  const dressingRoom = new DressingRoomModal(snowman);
  const decorationManager = new DecorationManager();
  const decorationPalette = new DecorationPalette(decorationManager);
  const eventManager = new EventManager(snowEngine.getAccumulator(), taskbar);
  const snowballBuilder = new SnowballBuilder(taskbar);

  snowballBuilder.onSnowmanCreated = (newSnowman) => {
    snowman.setPosition(newSnowman.x, newSnowman.y);
  };

  const deckButton = document.createElement("button");
  deckButton.id = "deck-screen-pill";
  deckButton.innerHTML = "<span>🎀</span> Deck Screen";
  Object.assign(deckButton.style, {
    position: "fixed",
    top: "14px",
    right: "24px",
    zIndex: "900",
    background: "rgba(20, 26, 38, 0.72)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
    pointerEvents: "auto",
    transition: "all 0.2s ease"
  });

  deckButton.addEventListener("mouseenter", () => {
    window.winterDesk?.setIgnoreMouseEvents(false);
  });
  deckButton.addEventListener("mouseleave", () => {
    window.winterDesk?.setIgnoreMouseEvents(true, true);
  });
  deckButton.addEventListener("click", () => {
    decorationPalette.toggle();
  });
  document.body.appendChild(deckButton);

  if (window.winterDesk) {
    window.winterDesk.onConfigChange((config) => {
      snowEngine.setConfig(config);
    });

    window.winterDesk.onTriggerEvent((event) => {
      eventManager.trigger(event);
    });

    window.winterDesk.onToggleDressingRoom(() => {
      dressingRoom.toggle();
    });

    window.winterDesk.onToggleDecorations(() => {
      decorationPalette.toggle();
    });

    window.winterDesk.onWindowsUpdated((windows) => {
      snowEngine.setOpenWindows(windows);
    });
  }

  let isHoveringSnowman = false;
  let isDraggingSnowman = false;
  let isMouseInteractive = false;
  let snowmanDragStartX = 0;
  let snowmanDragStartY = 0;
  let snowmanOffsetX = 0;
  let snowmanOffsetY = 0;
  let hasMovedSignificantly = false;

  function updateInteractiveHover(mouseX: number, mouseY: number): void {
    const hoveringSnowman = snowman.containsPoint(mouseX, mouseY);
    const hoveringFighter = eventManager.containsFighter(mouseX, mouseY);
    const hoveringSnow = snowEngine.isNearSnow(mouseX, mouseY);
    const decorHandled = decorationManager.handleMouseMove(mouseX, mouseY);

    const isInteractive =
      hoveringSnowman ||
      hoveringFighter ||
      hoveringSnow ||
      decorHandled ||
      isDraggingSnowman ||
      snowballBuilder.isBuilding;

    if (hoveringSnowman !== isHoveringSnowman) {
      isHoveringSnowman = hoveringSnowman;
      snowman.setWaving(hoveringSnowman);
    }

    if (isInteractive !== isMouseInteractive) {
      isMouseInteractive = isInteractive;
      window.winterDesk?.setIgnoreMouseEvents(!isInteractive, true);
    }
  }

  window.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      if (eventManager.containsFighter(e.clientX, e.clientY)) {
        eventManager.stopSnowballFight();
        return;
      }
      decorationManager.handleMouseDown(e.clientX, e.clientY, 2);
      return;
    }

    if (eventManager.containsFighter(e.clientX, e.clientY)) {
      eventManager.stopSnowballFight();
      return;
    }

    if (snowman.containsPoint(e.clientX, e.clientY)) {
      isDraggingSnowman = true;
      hasMovedSignificantly = false;
      snowmanDragStartX = e.clientX;
      snowmanDragStartY = e.clientY;
      snowmanOffsetX = e.clientX - snowman.x;
      snowmanOffsetY = e.clientY - snowman.y;
      window.winterDesk?.setIgnoreMouseEvents(false);
      return;
    }

    if (snowEngine.isNearSnow(e.clientX, e.clientY)) {
      snowballBuilder.startAt(e.clientX, e.clientY);
      window.winterDesk?.setIgnoreMouseEvents(false);
      return;
    }

    decorationManager.handleMouseDown(e.clientX, e.clientY, 0);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingSnowman) {
      const dist = Math.hypot(e.clientX - snowmanDragStartX, e.clientY - snowmanDragStartY);
      if (dist > 5) {
        hasMovedSignificantly = true;
      }
      snowman.setPosition(e.clientX - snowmanOffsetX, e.clientY - snowmanOffsetY);
      return;
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseMove(e.clientX, e.clientY);
      return;
    }

    updateInteractiveHover(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", (e) => {
    if (isDraggingSnowman) {
      isDraggingSnowman = false;
      if (!hasMovedSignificantly && snowman.containsPoint(e.clientX, e.clientY)) {
        dressingRoom.toggle();
      }
      updateInteractiveHover(e.clientX, e.clientY);
      return;
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseUp();
      updateInteractiveHover(e.clientX, e.clientY);
      return;
    }

    decorationManager.handleMouseUp();
    updateInteractiveHover(e.clientX, e.clientY);
  });

  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  window.addEventListener("resize", async () => {
    decorationManager.resize(window.innerWidth);
    if (window.winterDesk?.getTaskbarBounds) {
      const updatedTaskbar = await window.winterDesk.getTaskbarBounds();
      taskbar = updatedTaskbar;
      snowEngine.setTaskbar(updatedTaskbar);
      eventManager.setTaskbar(updatedTaskbar);
      snowballBuilder.setTaskbar(updatedTaskbar);
    }
  });

  snowEngine.onRenderEntities = (ctx: CanvasRenderingContext2D): void => {
    snowman.update(taskbar);
    eventManager.update();
    decorationManager.update();

    decorationManager.draw(ctx);
    snowman.draw(ctx);
    eventManager.draw(ctx);
    snowballBuilder.draw(ctx);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch(console.error);
});
