import { SnowEngine } from "./snow/SnowEngine";
import { Snowman } from "./characters/Snowman";
import { DressingRoomModal } from "./ui/DressingRoom";
import { EventManager } from "./events/EventManager";
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
  const eventManager = new EventManager(snowEngine.getAccumulator(), taskbar);

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
      dressingRoom.toggle();
    });
  }

  let isHoveringSnowman = false;

  window.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const hovering = snowman.containsPoint(mouseX, mouseY);

    if (hovering && !isHoveringSnowman) {
      isHoveringSnowman = true;
      snowman.setWaving(true);
      window.winterDesk?.setIgnoreMouseEvents(false);
    } else if (!hovering && isHoveringSnowman) {
      isHoveringSnowman = false;
      snowman.setWaving(false);
      window.winterDesk?.setIgnoreMouseEvents(true, true);
    }
  });

  window.addEventListener("click", (e) => {
    if (snowman.containsPoint(e.clientX, e.clientY)) {
      dressingRoom.toggle();
    }
  });

  window.addEventListener("resize", async () => {
    if (window.winterDesk?.getTaskbarBounds) {
      const updatedTaskbar = await window.winterDesk.getTaskbarBounds();
      taskbar = updatedTaskbar;
      snowEngine.setTaskbar(updatedTaskbar);
      eventManager.setTaskbar(updatedTaskbar);
    }
  });

  const ctx = canvas.getContext("2d")!;
  const entityLoop = (): void => {
    snowman.update(taskbar);
    eventManager.update();

    snowman.draw(ctx);
    eventManager.draw(ctx);

    requestAnimationFrame(entityLoop);
  };
  requestAnimationFrame(entityLoop);
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch(console.error);
});
