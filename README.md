# Professional Flipbook PDF Viewer

A high-performance, interactive web-based flipbook viewer for "Micro_Project Final Draft.pdf". This project provides a premium reading experience with realistic 3D page-turning animations, built entirely with modern web technologies.

## 🚀 Features

- **Realistic 3D Flip:** Experience smooth, high-fidelity page-turning animations with support for hard covers and soft inner pages.
- **Client-Side PDF Rendering:** Uses **PDF.js** to render high-quality pages directly from the source PDF.
- **Dual Navigation:**
    - **Right Sidebar:** Vertically scrollable thumbnail list for quick access.
    - **Bottom Tray:** Horizontal thumbnail slider for a cinematic browsing experience.
- **Interactive Controls:**
    - **Zoom:** Precision zoom in/out functionality.
    - **Search:** Integrated search UI for navigating document content.
    - **Jump to Page:** Quickly navigate to any specific page number.
    - **Auto-flip:** Automatic slideshow mode for hands-free reading.
- **Enhanced UX:**
    - **Page Flip Sound:** Satisfying audio feedback on every turn.
    - **Progress Bar:** Visual progress indicator with live page previews on hover.
    - **Fullscreen:** Immersive reading mode.
- **Responsive Design:** Fully optimized for Desktop, Tablet, and Mobile devices.

## 🛠️ Tech Stack

- **PDF Rendering:** [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla.
- **Animation Engine:** [Page-Flip](https://github.com/Nodlik/StPageFlip).
- **Icons:** [Lucide Icons](https://lucide.dev/).
- **Styles:** Custom Vanilla CSS with a focus on modern, professional aesthetics.
- **Runtime:** Pure JavaScript (No heavy frameworks).

## 📋 Prerequisites

Due to browser security (CORS) and the way PDF.js loads external files, you **cannot** open `index.html` directly from your file system (`file://`). You must run it through a local web server.

## 🚀 How to Run Locally

### Option 1: Using Node.js (Recommended)
If you have Node.js installed, run:
```bash
npx serve
```
Then open the provided URL (usually `http://localhost:3000`).

### Option 2: Using Python
If you have Python installed:
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000`.

### Option 3: VS Code Live Server
If you use VS Code, install the "Live Server" extension and click **"Go Live"** at the bottom right.

## 📁 Project Structure

- `index.html`: Main application structure and viewer layout.
- `script.js`: Core logic for PDF rendering, flipbook initialization, and UI interactions.
- `style.css`: Professional styling, animations, and responsive layouts.
- `Micro_Project Final Draft.pdf`: The source PDF document.
- `page-flip.mp3`: Audio file for page-turning sound effects.

## ⚙️ Customization

To use your own PDF, simply update the `PDF_PATH` constant at the top of `script.js`:
```javascript
const PDF_PATH = 'your-file-name.pdf';
```
