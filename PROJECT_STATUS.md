# WinterDesk - Project Status & Architectural Handoff

## 1. Project Overview & Mission

WinterDesk is an open-source, background-running Windows 10 and 11 desktop companion. It brings an ambient winter atmosphere, customizable characters, interactive holiday decorations, manual snowball building, companion buddy interactions, dynamic vehicles, and interactive snow shoveling directly onto the user's desktop, floating seamlessly above application windows and interacting with both the Windows Taskbar and open application windows.

- **Repository**: https://github.com/FrostSue/Winter-Desk.git
- **Target OS**: Windows 10 / Windows 11 (64-bit)
- **Primary Tech Stack**: Electron 33, Vite 6, TypeScript 5, HTML5 2D Canvas (60 FPS)

---

## 2. Feature Implementation Status

| Feature Module | Source Location | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **Snowfall Particle Engine** | `src/snow/Particle.ts` | Complete | Drifting snowflakes with sway, gravity, and variable wind velocity. |
| **Taskbar Snow Accumulation** | `src/snow/Accumulator.ts` | Complete | Heightmap column buffer creating natural snowbanks along the taskbar that melt gradually. |
| **Open Window Snow Accumulation** | `src/snow/SnowEngine.ts`, `scripts/WindowTracker.cs` | Complete | Balanced snow accumulation on top-level window titlebars with real-time 40 FPS native tracking, window ID persistence, and Z-order occlusion clipping preventing snow bleed-through on foreground windows. |
| **Window Snow Shoveling & Multi-Window Fling Cascade** | `src/snow/SnowEngine.ts`, `src/main.ts` | Complete | Intuitive click-to-shovel and downward-swipe flinging; cascades 35+ tumbling snow clumps across desktop windows with physical collision detection, transferring snow between windows and down to the taskbar. |
| **Unified 60 FPS Render Loop** | `src/snow/SnowEngine.ts` | Complete | Unified `requestAnimationFrame` loop with optimized particle fills and zero `shadowBlur` overhead for low CPU/GPU usage. |
| **Interactive Snowmen** | `src/characters/Snowman.ts` | Complete | Main permanent snowman plus user-built snowmen; freely draggable anywhere, attachable to window titlebars to ride moving windows, customizable, and removable via right-click. |
| **Companion Winter Buddy** | `src/characters/CompanionBuddy.ts` | Complete | Animated waddling penguin companion with fluttering scarf; wanders desktop, waves, boards trains, and shovels snow. |
| **Snowball Builder** | `src/characters/SnowballBuilder.ts` | Complete | Free-form snowball rolling on open window snowbanks as well as ground snow; rolling gathers snow and grows; balls and stacked snowmen attach to window titlebars and follow moving windows. |
| **Snowman Wardrobe Modal** | `src/ui/DressingRoom.ts` | Complete | Windows 11 Fluent glassmorphism panel targeting any selected snowman for hats, faces, clothing, and accessories. |
| **Deck Your Desktop Palette** | `src/ui/DecorationPalette.ts` | Complete | Modal drawer with 16 festive ornaments, fairy light theme switchers, sag depth presets (Straight, Gentle, Drape), non-blocking desktop pass-through, and vehicle spawners. |
| **Floating Quick-Deck Trigger** | `src/main.ts` | Complete | Subtle on-screen pill button for instant access to the decoration palette without opening system tray. |
| **Adjustable Fairy Lights** | `src/decorations/FairyLights.ts` | Complete | Three-point Bezier garland with draggable left/right handles, diamond sag control handle, height positioning, color themes, and glowing bulbs. |
| **Festive Ornaments** | `src/decorations/Ornament.ts`, `DecorationManager.ts` | Complete | 16 festive items with pendulum physics, drag & drop placement anywhere, and right-click removal. |
| **Snowplough Crawler (Piste-Basher)** | `src/events/EventManager.ts` | Complete | Authentic yellow crawler snowcat with caterpillar tracks, 4 rotating bogie wheels, roof beacon, and angled plow blade driving across taskbar clearing accumulated snow with spray. |
| **Gift Express Train with Boarding**| `src/events/EventManager.ts` | Complete | Locomotive with passenger carriage; snowman and companion can board the train and ride across the desktop. |
| **Snowball Fight Duels** | `src/events/EventManager.ts` | Complete | Two snowmen spawn and lob snowballs with gravity arcs; stoppable via click, right-click, tray, or 12-round auto-finish. |
| **Santa & Sleigh** | `src/events/EventManager.ts` | Complete | Flying sleigh across the sky with stardust particle trail. |
| **Screen Share & IPC Safety** | `electron/main.ts` | Complete | Window occlusion flags, content protection bypass, and cached mouse ignore state preventing black screens and freezes. |
| **Native System Tray** | `electron/tray.ts` | Complete | Windows system tray menu with snowfall intensity, wind, event triggers, and startup toggles using native ICO asset. |

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
│   ├── main.ts             # Electron main process, window creation, screen capture flags, taskbar IPC
│   ├── preload.ts          # Safe contextBridge exposing window.winterDesk
│   └── tray.ts             # System tray manager and context menus
├── release/                # Output directory for NSIS setup and portable executables (gitignored)
│   ├── WinterDesk-Portable-1.0.2.exe
│   └── WinterDesk-Setup-1.0.2.exe
├── scripts/
│   ├── WindowTracker.cs    # Native C# real-time Win32 titlebar and occlusion tracker
│   ├── WindowTracker.exe   # Precompiled tracking executable
│   └── get_windows.ps1     # PowerShell fallback tracker
├── src/
│   ├── characters/
│   │   ├── CompanionBuddy.ts  # Waddling winter companion friend (penguin)
│   │   ├── SnowballBuilder.ts # Free-form snowball rolling and snowman stacking
│   │   └── Snowman.ts         # Snowman character entity with vector rendering
│   ├── decorations/
│   │   ├── DecorationManager.ts # Coordinates lights and 16 ornaments with wire dragging
│   │   ├── FairyLights.ts       # Draggable wire garland with color themes
│   │   └── Ornament.ts          # 16 festive ornaments with pendulum swing physics
│   ├── events/
│   │   └── EventManager.ts      # Vehicles (Plough, Santa, Passenger Train) and snowball duels
│   ├── snow/
│   │   ├── Accumulator.ts       # Heightmap engine for taskbar snow accumulation
│   │   ├── Particle.ts          # Snowflake particle physics
│   │   └── SnowEngine.ts        # Core 60 FPS loop, window snow, and cascade shoveling
│   ├── ui/
│   │   ├── DecorationPalette.ts # Deck Your Desktop drawer with light themes
│   │   └── DressingRoom.ts      # Multi-target snowman wardrobe modal
│   ├── main.ts             # Application coordinator and mouse event pass-through
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

### Building Standalone Executable
```bash
npm run package
```
Generates `release/WinterDesk-win32-x64/WinterDesk.exe`.

---

## 5. Architectural Guidelines for Future Agents

1. **Atomic Commits**: Adhere strictly to the single-file atomic Git commit policy. Every file creation or modification must be committed individually with an English descriptive message.
2. **Zero Inline Comments**: Do not place inline comments inside source code files.
3. **Window Tracking & Z-Order Occlusion**: Always use the native `WindowTracker.exe` (C# Win32 EnumDesktopWindows) streaming JSON updates via stdout. In `SnowEngine.ts`, window snow is clipped against all higher Z-order windows to prevent background snow from rendering over foreground windows. Snow depth is indexed by window handle ID so positions track fluidly across window drag movements.
4. **Canvas Performance & Low CPU/GPU Overhead**: Never use `ctx.shadowBlur` in tight particle loops (such as snowflakes). Use crisp alpha blending and pre-computed gradients instead.
5. **Palette Mouse Pass-Through**: Ensure transparent full-screen Electron overlays release mouse events (`setIgnoreMouseEvents(true, true)`) whenever the cursor leaves modal bounding boxes (`containsPoint`), keeping Windows apps and desktop icons clickable.
6. **Debounced Mouse Pass-Through**: Do NOT call `setIgnoreMouseEvents` from multiple sub-managers or on every mouse move. Centralize interactivity state in `main.ts` and cache state in `electron/main.ts` to prevent Windows User32 `WS_EX_TRANSPARENT` IPC flooding and UI freezes.
7. **Screen Share Compatibility**: Keep `type: "toolbar"` and `setContentProtection(false)` enabled in `electron/main.ts` so DWM does not occlude the desktop or trigger black screen capture issues on Discord or OBS.
8. **Taskbar Boundaries**: Always use `window.winterDesk.getTaskbarBounds()` to dynamically query the Windows taskbar dimensions across single or multi-monitor configurations.
