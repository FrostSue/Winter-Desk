# WinterDesk

WinterDesk is a high-performance, ambient winter desktop companion designed for Windows 10 and Windows 11. It brings authentic seasonal physics, customizable holiday companions, interactive snowfall, dynamic window snow accumulation, and festive decorations directly to your desktop without getting in the way of your workflow.

---

## Key Features

### 1. Window-Aware Snow Simulation
- **Zero Window Drag Friction**: The transparent desktop overlay selectively captures mouse inputs only on active interactive objects. Native Windows titlebars remain click-through, allowing natural dragging, snapping, minimizing, and tab switching.
- **Occlusion-Clipped Snowdrifts**: Real-time Win32 window tracking renders snowdrifts along the upper edge of active application windows, respecting window Z-order.
- **Window Snow Depletion**: Rolling snowballs or shoveling snow along window edges visibly decreases the snow depth.
- **Full-Width Window Avalanche**: When an open window is minimized, closed, shrunk, or moved downward, its resting snow cascade falls across the entire width of the window onto lower windows or the taskbar.

### 2. Snowman & Physics Mechanics
- **Free-Form Snowball Rolling**: Roll snow on the taskbar or along the crest of window snowdrifts to form snowballs with dynamic growth and rotation.
- **Multi-Snowman Construction**: Stack rolling snowballs to construct multiple custom snowmen across the taskbar and open windows.
- **Falling & Shattering Impact**: If an attached window closes or resizes, snowmen fall with realistic gravity and tilt. Dropping from significant heights causes the snowman to shatter into bouncing snowballs, scattering accessories (hat, scarf, broom, carrot nose), and snow dust particles.
- **Wardrobe Customization**: Click or tap any standing snowman to open the dressing room modal and customize hats, faces, clothing, and handheld accessories.

### 3. Holiday Decorations & Events
- **Adjustable Fairy Lights Garland**: A multi-point garland spanning the display width with an interactive sag handle for adjusting garland curvature.
- **Deck Screen Palette**: Quick access to ornaments, lights, quick sag presets, and event triggers.
- **Piste-Basher Snowcat**: Animated crawler piste-basher snowcat equipped with caterpillar tracks, revolving bogie wheels, roof beacon, and front blade that clears accumulated snowdrifts.
- **Holiday Express Train**: Boardable taskbar train allowing the snowman and companion buddy to ride across the screen.

---

## Installation & GitHub Releases

WinterDesk provides single-file executable distributions ready for use:

1. **Setup Installer (`WinterDesk-Setup.exe`)**:
   - Single-click setup that automatically configures WinterDesk and adds a Desktop shortcut.
2. **Portable Executable (`WinterDesk-Portable.exe`)**:
   - Completely self-contained single executable. Run directly with zero installation required.

Visit the [GitHub Releases](https://github.com/FrostSue/Winter-Desk/releases) section to download the latest setup or portable package.

---

## Development & Building

### Prerequisites
- Node.js 20+
- Windows 10 or 11 (64-bit)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Packaging Single Executable
To compile and package the NSIS installer and portable single executables into the `release/` folder:
```bash
npm run dist
```

---

## Controls Quick Guide

| Action | Control |
| :--- | :--- |
| **Move / Drag Windows** | Normal left-click and drag on any window titlebar |
| **Roll Snowball** | Click and drag along accumulated snow on the taskbar or snow crests |
| **Stack Snowman** | Drag a rolled snowball onto another resting ball |
| **Move Snowman** | Left-click and drag any snowman to relocate it |
| **Customize Wardrobe** | Left-click on any stationary snowman to open wardrobe |
| **Remove Extra Snowman** | Right-click on a user-created snowman |
| **Adjust Fairy Lights Sag** | Click and drag the golden diamond handle at the center of the lights |
| **Deck Screen Menu** | Click the Deck Screen button at the top-right corner |
| **System Tray** | Access settings, wind, density, and options via the taskbar tray icon |

---

## License

WinterDesk is distributed under a permissive project license. See `LICENSE` for details.
