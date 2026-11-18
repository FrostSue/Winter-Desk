# WinterDesk - Project Status & Architectural Handoff

## 1. Project Overview & Mission

WinterDesk is an open-source, background-running Windows 10 and 11 desktop companion. It brings an ambient winter atmosphere, customizable characters, interactive holiday decorations, and dynamic vehicles directly onto the user's desktop, floating seamlessly above application windows and interacting with the Windows Taskbar.

- **Repository**: https://github.com/FrostSue/Winter-Desk.git
- **Target OS**: Windows 10 / Windows 11 (64-bit)
- **Primary Tech Stack**: Electron 33, Vite 6, TypeScript 5, HTML5 2D Canvas (60 FPS)

---

## 2. Feature Implementation Status

| Feature Module | Source Location | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **Snowfall Particle Engine** | `src/snow/Particle.ts` | Complete | Drifting snowflakes with sway, gravity, and variable wind velocity. |
| **Taskbar Snow Accumulation** | `src/snow/Accumulator.ts` | Complete | Heightmap column buffer creating natural snowbanks along the taskbar that melt gradually. |
| **Unified 60 FPS Render Loop** | `src/snow/SnowEngine.ts` | Complete | Unified `requestAnimationFrame` loop preventing canvas clearing conflicts. |
| **Interactive Snowman** | `src/characters/Snowman.ts` | Complete | Rolling snowball spawn, breathing idle, waving on hover, modular attachments. |
| **Snowman Wardrobe Modal** | `src/ui/DressingRoom.ts` | Complete | Windows 11 Fluent glassmorphism panel for hats, faces, clothing, and accessories. |
| **Desktop Decorations** | `src/decorations/FairyLights.ts`, `Ornament.ts`, `DecorationManager.ts` | Complete | Draggable catenary fairy lights with glowing bulbs, swinging baubles, wreaths, and holiday tree. |
| **Snowplough Vehicle** | `src/events/EventManager.ts` | Complete | Drives across taskbar clearing accumulated snowbanks with snow spray. |
| **Snowball Fight Duels** | `src/events/EventManager.ts` | Complete | Two snowmen spawn and lob snowballs with gravity arcs and speech bubbles. |
| **Santa & Sleigh** | `src/events/EventManager.ts` | Complete | Flying sleigh across the sky with stardust particle trail. |
| **Gift Express Train** | `src/events/EventManager.ts` | Complete | Locomotive with rolling wheels, steam puffs, gifts, and holiday greeting envelope. |
| **Native System Tray** | `electron/tray.ts` | Complete | Windows system tray menu with snowfall intensity, wind, event triggers, and startup toggles using native ICO asset. |
| **Transparent Desktop Layer** | `electron/main.ts` | Complete | Frameless, transparent, always-on-top click-through overlay with automatic taskbar dimension detection. |

---

## 3. Directory & File Structure

```text
winterdesk/
├── assets/
│   ├── icon.ico            # Multi-resolution Windows app icon (16, 24, 32, 48, 64)
│   ├── icon.png            # 256x256 high-resolution icon
│   ├── tray.ico            # Multi-resolution Windows notification tray icon
│   └── tray.png            # 32x32 tray icon
├── dist/                   # Compiled Vite web assets
├── dist-electron/          # Compiled Electron main and preload scripts
├── electron/
│   ├── main.ts             # Electron main process, window creation, taskbar bounds IPC
│   ├── preload.ts          # Safe contextBridge exposing window.winterDesk
│   └── tray.ts             # System tray manager and context menus
├── src/
│   ├── characters/
│   │   └── Snowman.ts      # Snowman character entity with vector rendering
│   ├── decorations/
│   │   ├── DecorationManager.ts # Coordinates lights and ornaments with mouse dragging
│   │   ├── FairyLights.ts  # Draggable catenary wire with glowing bulbs
│   │   └── Ornament.ts     # Swinging festive baubles and wreaths
│   ├── events/
│   │   └── EventManager.ts # Vehicles (Snowplough, Santa, Train) and snowball duels
│   ├── snow/
│   │   ├── Accumulator.ts  # Heightmap engine for surface snow accumulation
│   │   ├── Particle.ts     # Snowflake particle physics
│   │   └── SnowEngine.ts   # Core 60 FPS Canvas rendering loop
│   ├── ui/
│   │   └── DressingRoom.ts # Glassmorphic customization modal
│   ├── main.ts             # Client bootstrap and mouse interaction routing
│   ├── style.css           # Full-screen transparent overlay stylesheet
│   └── types.ts            # Type definitions and IPC contract
├── index.html              # HTML canvas host
├── package.json            # Node dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── start-winterdesk.bat    # One-click desktop launcher
```

---

## 4. How to Run & Build

### Running Locally
```bash
# Build Vite and Electron bundles
npm run build

# Start the application via Electron runner
npm start
```

### Launching via Batch File
Users can double-click `start-winterdesk.bat` in the project root to build and run the application in their active desktop session.

---

## 5. Architectural Guidelines for Future Agents

1. **Atomic Commits**: Adhere strictly to the single-file atomic Git commit policy. Every file creation or modification must be committed individually with an English descriptive message.
2. **Zero Inline Comments**: Do not place inline comments inside source code files.
3. **Transparent Click-Through**: Any interactive element (snowman, lights handle, dressing room) must toggle `window.winterDesk.setIgnoreMouseEvents(false)` on hover/focus, and restore `setIgnoreMouseEvents(true, { forward: true })` on mouse leave so normal desktop productivity is not disrupted.
4. **Taskbar Boundaries**: Always use `window.winterDesk.getTaskbarBounds()` to dynamically query the Windows taskbar dimensions across single or multi-monitor configurations.
