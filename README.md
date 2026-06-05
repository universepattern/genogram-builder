# Genogram.studio

### Live Web Application: [https://universepattern.github.io/genogram-builder/](https://universepattern.github.io/genogram-builder/)
An interactive, premium web application designed to help students and clinicians build and export professional-grade genograms for their assignments and case files. Built in vanilla HTML5, CSS3, and JavaScript, the application runs entirely in the browser with zero compile or installation steps.

---

## Key Features

1. **Legend-to-Canvas Spawning**:
   - Spawns members directly onto the canvas by clicking Male, Female, Other, or Pregnancy in the bottom legend.
   - Automatically switches focus to the name input field in the edit panel for instant typing.

2. **Smart Non-Overlapping Layout**:
   - Integrates a grid-aligned ring-based spiral search algorithm. New members and links automatically adjust their position on a 20px grid to prevent overlapping nodes.

3. **Genogram Connection Heuristics**:
   - Spawning relative nodes (Father, Mother, Partner, Child) automatically configures family relationships:
     - Spawning a Father/Mother automatically merges single parents into partnerships when an opposite single parent is present.
     - Spawning a Partner automatically creates a marriage link.
     - Spawning a Child links them directly to the parents' partnership if exactly one exists.

4. **Connection Shortcuts**:
   - Select a member to use shortcuts like **Use as Partner A**, **Use as Partner B**, or **Use as Child** to bypass manual dropdown selections.
   - Select a connection line to use the **Use as Parent Pair** shortcut.

5. **Aesthetic Compliance**:
   - Double-borders for Index Person / Proband.
   - Square brackets `[ ]` for Adopted status.
   - Crossed-out shapes (diagonal X) for Deceased members.
   - Centered solid dot for carrier status (autosomal recessive/X-linked carriers).
   - Solid partner lines for Marriage, dashed for Cohabitation, single slashed for Separation, and double slashed for Divorce.

6. **Interactive Canvas Controls**:
   - Full drag-and-drop node placement.
   - Infinite pan and scroll-to-zoom (including mobile multi-touch pinch-to-zoom).
   - "Fit Screen" and "Auto Layout" arrangement solvers.

7. **Multi-Format Export Engine**:
   - High-DPI rasterization (PNG, JPEG).
   - Scalable Vector Graphics (SVG).
   - PDF Reports with a complete family registry table.
   - Word Documents (DOC) with embedded base64 graphics.

---

## How to Use

Follow this simple 4-step workflow to build a genogram:
1. **Spawn Members**: Click any gender shape in the bottom legend (e.g. *Male (Add)*) to place a new member at the center of the screen.
2. **Edit Details**: The editor opens automatically on creation. Type their name, set age/years/medical conditions, and click **Save Changes**.
3. **Connect Partners**: Click one member, select **Use as Partner A**. Click their partner, select **Use as Partner B**. Open section 2 in the sidebar and click **Connect Partners**.
4. **Link Children**: Click the connection line between parents, select **Use as Parent Pair**. Click a child node, select **Use as Child**. Click **Link Child** in the sidebar.

*Tip: Drag shapes at any time to customize the layout. The canvas automatically snap-aligns to the grid and avoids overlaps.*

---

## Desktop & Mobile Controls
- **Mouse**: Middle-drag or Space-drag to Pan | Scroll wheel to Zoom | Left-click and drag nodes to move.
- **Mobile Touch**: Touch and drag empty background to Pan | Pinch with two fingers to Zoom | Touch and drag shapes to move.
- **Floating View Toggle (FAB)**: Stacks controls cleanly on mobile viewports. Tap **Edit Data** to open sidebar forms and **View Canvas** to return to the interactive diagram.
