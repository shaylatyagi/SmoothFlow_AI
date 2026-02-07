# 📚 SmoothFlow AI: Intelligent PDF Audio-Tutor

![Project Status](https://img.shields.io/badge/Status-Prototype_Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-HTML_CSS_JS-blue)

**A context-aware PDF reader designed to fix the broken experience of standard TTS engines.**
*Better than MS Edge Read Aloud. Includes Hinglish Explanations.*

> **Course Project for Natural Language Processing (NLP)**

---

## 👥 Team Members
1. **Shayla Tyagi**
2. **Nirmit**
3. **Rajan**
4. **Arihant**

---

## 🎯 The Problem
Students struggle with reading technical PDFs because:
1.  **Robotic Voices:** Standard readers lack natural pacing.
2.  **Context Switching:** Stopping to Google technical terms breaks focus.
3.  **Loss of Control:** No easy way to speed up revision or navigate quickly.

## 💡 Our Solution
**SmoothFlow AI** is a browser-based PDF Tutor that combines a modern reading interface with NLP-inspired features.

### ✨ Key Features
* **📖 Edge-Style Interface:** Split-screen view (PDF on left, Reader on right).
* **🧠 Hinglish Context Explainer:** Select technical terms (like *"Stack"*, *"Recursion"*) to get an instant explanation in Hinglish.
* **⚡ Smart Controls:** Variable speed (0.5x - 2x), Voice Selection, and Auto-Page Flip.
* **⌨️ Shortcuts:** `Space` (Play/Pause), `Arrows` (Next/Prev Page).

---

## 🚀 How to Run (Step-by-Step)

⚠️ **IMPORTANT:** You cannot simply double-click `index.html`. You must run it on a local server because browsers block PDF access on local files.

### Option 1: Using VS Code (Recommended)
1.  **Download Code:** Click on `<> Code` button above -> **Download ZIP** and extract it.
2.  **Open in VS Code:** Right-click the extracted folder and select "Open with Code".
3.  **Install Extension:** Go to Extensions (left sidebar) -> Search **"Live Server"** -> Install it.
4.  **Run:** Open `index.html` -> Right-click anywhere in the code -> Select **"Open with Live Server"**.

### Option 2: Using Python (If you don't have VS Code)
1.  Open Terminal/Command Prompt in the project folder.
2.  Type: `python -m http.server 8000`
3.  Open Browser and go to: `http://localhost:8000`

---

## 🧪 How to Test the Project (Demo Flow)

1.  **Upload:** Click "Choose PDF File" and upload any document.
2.  **AI Popup:** Select/Highlight the word **"Stack"** or **"Algorithm"** in the PDF.
    * *Wait 1 second...* A popup will appear explaining it in Hinglish.
3.  **Audio:** Click **Play**. Change speed to **1.5x** to test the NLP engine.
4.  **Shortcuts:** Press `Spacebar` to pause/play.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (Glassmorphism UI)
* **Logic:** Vanilla JavaScript (ES6+)
* **PDF Core:** `Mozilla PDF.js`
* **Audio:** `Web Speech API`

---

**Submitted by Shayla, Nirmit, Rajan, & Arihant**
