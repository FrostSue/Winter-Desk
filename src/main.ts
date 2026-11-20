import { SnowEngine } from "./snow/SnowEngine";
import { Snowman } from "./characters/Snowman";
import { CompanionBuddy } from "./characters/CompanionBuddy";
import { SnowballBuilder } from "./characters/SnowballBuilder";
import { DressingRoomModal } from "./ui/DressingRoom";
import { DecorationPalette } from "./ui/DecorationPalette";
import { EventManager } from "./events/EventManager";
import { DecorationManager } from "./decorations/DecorationManager";
import type { TaskbarBounds, WindowBounds } from "./types";

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
  let openWindows: WindowBounds[] = [];

  if (window.winterDesk?.getTaskbarBounds) {
    taskbar = await window.winterDesk.getTaskbarBounds();
  }

  const snowEngine = new SnowEngine(canvas);
  snowEngine.setTaskbar(taskbar);
  snowEngine.start();

  const mainSnowman = new Snowman(window.innerWidth * 0.75, taskbar);
  mainSnowman.isRemovable = false;
  let snowmen: Snowman[] = [mainSnowman];

  const companion = new CompanionBuddy(window.innerWidth * 0.42, taskbar.y);
  const dressingRoom = new DressingRoomModal(mainSnowman);
  const decorationManager = new DecorationManager();
  const decorationPalette = new DecorationPalette(decorationManager);
  const eventManager = new EventManager(snowEngine.getAccumulator(), taskbar);
  const snowballBuilder = new SnowballBuilder(snowEngine, taskbar);

  decorationPalette.onTriggerEvent = (event) => {
    eventManager.trigger(event);
  };

  function bindSnowman(s: Snowman): void {
    s.onShatter = (_x, _y, isRemovable) => {
      if (isRemovable) {
        setTimeout(() => {
          const idx = snowmen.indexOf(s);
          if (idx !== -1) {
            snowmen.splice(idx, 1);
          }
        }, 3200);
      }
    };
  }

  bindSnowman(mainSnowman);

  snowballBuilder.onSnowmanCreated = (newSnowman) => {
    bindSnowman(newSnowman);
    snowmen.push(newSnowman);
  };

  const deckButton = document.createElement("button");
  deckButton.id = "deck-screen-pill";
  deckButton.innerHTML = "<span>🎀</span> Deck Screen";
  Object.assign(deckButton.style, {
    position: "fixed",
    top: "14px",
    right: "24px",
    zIndex: "900",
    background: "rgba(20, 26, 38, 0.75)",
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
      dressingRoom.openWith(mainSnowman);
    });

    window.winterDesk.onToggleDecorations(() => {
      decorationPalette.toggle();
    });

    window.winterDesk.onWindowsUpdated((windows) => {
      openWindows = windows;
      snowEngine.setOpenWindows(windows);
      snowballBuilder.updateWindows(windows);
      for (const s of snowmen) {
        s.updateWindows(windows);
      }
    });
  }

  let draggedSnowman: Snowman | null = null;
  let isDraggingCompanion = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let hasMovedSignificantly = false;
  let isMouseInteractive = false;
  let snowGesture: {
    startX: number;
    startY: number;
    startTime: number;
    window: WindowBounds | null;
    isWindowSnow: boolean;
    isFlinging: boolean;
  } | null = null;

  function setInteractivity(interactive: boolean): void {
    if (interactive !== isMouseInteractive) {
      isMouseInteractive = interactive;
      window.winterDesk?.setIgnoreMouseEvents(!interactive, true);
    }
  }

  function updateInteractiveHover(mx: number, my: number): void {
    if (draggedSnowman || isDraggingCompanion || snowballBuilder.isBuilding || decorationManager.isDraggingAny()) {
      setInteractivity(true);
      return;
    }

    const hoverSnowman = snowmen.find((s) => s.containsPoint(mx, my));
    const hoverCompanion = companion.containsPoint(mx, my);
    const hoverFighter = eventManager.containsFighter(mx, my);
    const hoverSnow = snowEngine.isNearSnow(mx, my);
    const hoverDecor = decorationManager.hitTest(mx, my);
    const hoverBall = snowballBuilder.containsBall(mx, my);
    const hoverTrain = eventManager.isTrainNear(mx, my);
    const hoverPalette = decorationPalette.containsPoint(mx, my);
    const hoverGift = eventManager.isNearGift(mx, my);

    for (const s of snowmen) {
      s.setWaving(s === hoverSnowman);
    }
    companion.isWaving = hoverCompanion;

    const interactive = Boolean(
      hoverSnowman ||
      hoverCompanion ||
      hoverFighter ||
      hoverSnow ||
      hoverDecor ||
      hoverBall ||
      hoverTrain ||
      hoverPalette ||
      hoverGift
    );

    setInteractivity(interactive);
  }

  window.addEventListener("mousedown", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (decorationPalette.containsPoint(mx, my)) {
      return;
    }

    if (e.button === 2) {
      if (eventManager.containsFighter(mx, my)) {
        eventManager.stopSnowballFight();
        return;
      }

      for (let i = snowmen.length - 1; i >= 0; i--) {
        const s = snowmen[i];
        if (s.isRemovable && s.containsPoint(mx, my)) {
          snowmen.splice(i, 1);
          return;
        }
      }

      decorationManager.handleMouseDown(mx, my, 2);
      return;
    }

    if (eventManager.containsFighter(mx, my)) {
      eventManager.stopSnowballFight();
      return;
    }

    if (eventManager.hitTestGift(mx, my)) {
      setInteractivity(true);
      return;
    }

    if (eventManager.hasTrain() && eventManager.isTrainNear(mx, my)) {
      eventManager.boardTrain("snowman");
      eventManager.boardTrain("companion");
      mainSnowman.isRidingTrain = true;
      companion.isRidingTrain = true;
      return;
    }

    const clickedSnowman = snowmen.find((s) => s.containsPoint(mx, my));
    if (clickedSnowman) {
      draggedSnowman = clickedSnowman;
      clickedSnowman.isDragging = true;
      hasMovedSignificantly = false;
      dragStartX = mx;
      dragStartY = my;
      dragOffsetX = mx - clickedSnowman.x;
      dragOffsetY = my - clickedSnowman.y;
      setInteractivity(true);
      return;
    }

    if (companion.containsPoint(mx, my)) {
      isDraggingCompanion = true;
      companion.isDragging = true;
      hasMovedSignificantly = false;
      dragStartX = mx;
      dragStartY = my;
      dragOffsetX = mx - companion.x;
      dragOffsetY = my - companion.y;
      setInteractivity(true);
      return;
    }

    if (decorationManager.hitTest(mx, my)) {
      decorationManager.handleMouseDown(mx, my, 0);
      setInteractivity(true);
      return;
    }

    if (snowballBuilder.containsBall(mx, my)) {
      snowballBuilder.startAt(mx, my);
      setInteractivity(true);
      return;
    }

    const winSnow = snowEngine.getWindowSnowAt(mx, my);
    if (winSnow) {
      snowGesture = {
        startX: mx,
        startY: my,
        startTime: Date.now(),
        window: winSnow.window,
        isWindowSnow: true,
        isFlinging: false
      };
      snowballBuilder.startAt(mx, my);
      setInteractivity(true);
      return;
    }

    if (snowballBuilder.canStartAt(mx, my)) {
      snowGesture = {
        startX: mx,
        startY: my,
        startTime: Date.now(),
        window: null,
        isWindowSnow: false,
        isFlinging: false
      };
      snowballBuilder.startAt(mx, my);
      setInteractivity(true);
      return;
    }
  });

  window.addEventListener("mousemove", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (draggedSnowman) {
      const dist = Math.hypot(mx - dragStartX, my - dragStartY);
      if (dist > 5) {
        hasMovedSignificantly = true;
      }
      draggedSnowman.setPosition(mx - dragOffsetX, my - dragOffsetY);
      return;
    }

    if (isDraggingCompanion) {
      const dist = Math.hypot(mx - dragStartX, my - dragStartY);
      if (dist > 5) {
        hasMovedSignificantly = true;
      }
      companion.setPosition(mx - dragOffsetX, my - dragOffsetY);
      return;
    }

    if (snowGesture && snowGesture.isWindowSnow && !snowGesture.isFlinging) {
      const dy = my - snowGesture.startY;
      const dx = mx - snowGesture.startX;
      const elapsed = Date.now() - snowGesture.startTime;
      const dist = Math.hypot(dx, dy);
      const speed = dist / Math.max(1, elapsed);
      const isRolling = snowballBuilder.isBuilding && snowballBuilder.activeBall;

      if (!isRolling || (snowballBuilder.activeBall && snowballBuilder.activeBall.radius <= 9)) {
        if (elapsed < 320 && dist > 24 && speed > 0.35) {
          snowGesture.isFlinging = true;
          snowballBuilder.activeBall = null;
          snowballBuilder.isBuilding = false;
          const flingVx = dx * 0.35;
          const flingVy = Math.max(1.8, Math.min(6.5, dy * 0.35 + 2.0));
          snowEngine.flingWindowSnow(snowGesture.window!, snowGesture.startX, snowGesture.startY, flingVx, flingVy);
          snowGesture = null;
          updateInteractiveHover(mx, my);
          return;
        }
      }

      if (isRolling && (dist > 14 || (snowballBuilder.activeBall && snowballBuilder.activeBall.radius > 9))) {
        snowGesture = null;
      }
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseMove(mx, my);
      return;
    }

    if (decorationManager.isDraggingAny()) {
      decorationManager.handleMouseMove(mx, my);
      return;
    }

    decorationManager.handleMouseMove(mx, my);
    updateInteractiveHover(mx, my);
  });

  window.addEventListener("mouseup", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (draggedSnowman) {
      if (eventManager.hasTrain() && eventManager.isTrainNear(mx, my)) {
        eventManager.boardTrain("snowman");
        draggedSnowman.isRidingTrain = true;
      }

      if (!hasMovedSignificantly && draggedSnowman.containsPoint(mx, my)) {
        dressingRoom.openWith(draggedSnowman);
      }

      const nearWin = snowEngine.getNearestWindowAt(draggedSnowman.x, draggedSnowman.y);
      if (nearWin && Math.abs(draggedSnowman.y - nearWin.y) <= 35) {
        draggedSnowman.attachedWindowId = nearWin.id || null;
        draggedSnowman.windowOffsetX = draggedSnowman.x - nearWin.x;
        draggedSnowman.windowOffsetY = 0;
        draggedSnowman.setPosition(nearWin.x + draggedSnowman.windowOffsetX, nearWin.y);
      } else if (Math.abs(draggedSnowman.y - taskbar.y) <= 35) {
        draggedSnowman.attachedWindowId = null;
        draggedSnowman.setPosition(draggedSnowman.x, taskbar.y);
      } else {
        draggedSnowman.startFalling();
      }

      draggedSnowman.isDragging = false;
      draggedSnowman = null;
      updateInteractiveHover(mx, my);
      return;
    }

    if (isDraggingCompanion) {
      if (eventManager.hasTrain() && eventManager.isTrainNear(mx, my)) {
        eventManager.boardTrain("companion");
        companion.isRidingTrain = true;
      }
      companion.isDragging = false;
      isDraggingCompanion = false;
      updateInteractiveHover(mx, my);
      return;
    }

    if (snowGesture) {
      if (snowGesture.isWindowSnow && !snowGesture.isFlinging) {
        const dist = Math.hypot(mx - snowGesture.startX, my - snowGesture.startY);
        const elapsed = Date.now() - snowGesture.startTime;
        if (dist < 8 && elapsed < 260) {
          snowballBuilder.activeBall = null;
          snowballBuilder.isBuilding = false;
          snowEngine.flingWindowSnow(snowGesture.window!, snowGesture.startX, snowGesture.startY, (Math.random() - 0.5) * 3, 4.5);
        }
      }
      snowGesture = null;
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseUp();
      updateInteractiveHover(mx, my);
      return;
    }

    decorationManager.handleMouseUp();
    updateInteractiveHover(mx, my);
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
    for (const s of snowmen) {
      s.update(taskbar, openWindows);
    }
    snowballBuilder.update(taskbar, openWindows);
    companion.update(taskbar, openWindows);
    eventManager.update(openWindows);
    decorationManager.update();

    if (!eventManager.hasTrain()) {
      for (const s of snowmen) {
        if (s.isRidingTrain) {
          s.isRidingTrain = false;
          s.setPosition(s.x, taskbar.y);
        }
      }
      if (companion.isRidingTrain) {
        companion.isRidingTrain = false;
        companion.setPosition(companion.x, taskbar.y);
      }
    }

    decorationManager.draw(ctx);
    for (const s of snowmen) {
      if (!s.isRidingTrain) {
        s.draw(ctx);
      }
    }
    if (!companion.isRidingTrain) {
      companion.draw(ctx);
    }
    eventManager.draw(ctx);
    snowballBuilder.draw(ctx);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch(console.error);
});
