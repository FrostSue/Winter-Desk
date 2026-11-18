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
  let dragStartX = 0;
  let dragStartY = 0;
  let hasMovedSignificantly = false;

  window.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      decorationManager.handleMouseDown(e.clientX, e.clientY, 2);
      return;
    }

    if (snowman.containsPoint(e.clientX, e.clientY)) {
      isDraggingSnowman = true;
      hasMovedSignificantly = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      window.winterDesk?.setIgnoreMouseEvents(false);
      return;
    }

    if (e.clientY >= taskbar.y - 20) {
      snowballBuilder.startAt(e.clientX, e.clientY);
      window.winterDesk?.setIgnoreMouseEvents(false);
      return;
    }

    decorationManager.handleMouseDown(e.clientX, e.clientY, 0);
  });

  window.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    if (isDraggingSnowman) {
      const dist = Math.hypot(mouseX - dragStartX, mouseY - dragStartY);
      if (dist > 6) {
        hasMovedSignificantly = true;
      }
      snowman.setPosition(mouseX, mouseY);
      return;
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseMove(mouseX, mouseY);
      return;
    }

    const decorHandled = decorationManager.handleMouseMove(mouseX, mouseY);
    const hovering = snowman.containsPoint(mouseX, mouseY);

    if (hovering && !isHoveringSnowman) {
      isHoveringSnowman = true;
      snowman.setWaving(true);
      window.winterDesk?.setIgnoreMouseEvents(false);
    } else if (!hovering && isHoveringSnowman) {
      isHoveringSnowman = false;
      snowman.setWaving(false);
      if (!decorHandled && !snowballBuilder.isBuilding) {
        window.winterDesk?.setIgnoreMouseEvents(true, true);
      }
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (isDraggingSnowman) {
      isDraggingSnowman = false;
      if (!hasMovedSignificantly && snowman.containsPoint(e.clientX, e.clientY)) {
        dressingRoom.toggle();
      }
      window.winterDesk?.setIgnoreMouseEvents(true, true);
      return;
    }

    if (snowballBuilder.isBuilding) {
      snowballBuilder.handleMouseUp();
      window.winterDesk?.setIgnoreMouseEvents(true, true);
      return;
    }

    decorationManager.handleMouseUp();
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
