# Flipbook PDF Viewer (Heyzine Engine)

A professional, high-performance web-based flipbook viewer for "Micro_Project Final Draft.pdf", powered by the Heyzine flipbook engine.

## Features

- **Professional 3D Flip:** Realistic page-turning animations.
- **Table of Contents:** Integrated index/outline for easy navigation.
- **Interactive Controls:** Zoom, Search, Fullscreen, and Sound effects.
- **Responsive:** Automatically adapts to desktop and mobile devices.
- **No Branding:** Clean interface with Heyzine branding removed.

## Prerequisites

Due to browser security (CORS), you **cannot** open `index.html` directly from your file system (`file://`). You must run it through a local web server.

## How to Run Locally

### Option 1: Using Node.js (Recommended)
If you have Node.js installed, run this command in the project folder:
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

## Project Structure

- `index.html`: Main viewer page using the Heyzine engine.
- `Micro_Project Final Draft.pdf`: The source PDF file.
- `sample.html`: Original reference from Heyzine (backup).
- `script.js`: (Legacy) Custom implementation logic.
- `style.css`: (Legacy) Custom implementation styles.

## Configuration

The viewer is configured via the `flipbookcfg` object in `index.html`. You can customize the look and feel by modifying the `design` properties within that object.
