# FitAI — AI-Powered Virtual Dressing Room & Fashion E-Commerce Platform

FitAI is an end-to-end AI-powered virtual dressing room and Amazon-style fashion shopping website. It allows users to browse fashion apparel and test how outfits look on their body using two distinct capture modes: **Live Webcam** and **Photo Upload**.

---

## Key Features

1. **Dual Capture Experience**:
   - 📸 **Photo Upload**: Drag & drop or browse any portrait photo. Includes an instant 1-click test model for immediate testing.
   - 📹 **Live Webcam**: Live camera stream with body posture silhouette guide, 3-second countdown timer, shutter flash, camera flip, and snapshot review.
2. **Interactive Dressing Room Studio**:
   - **Split Slider**: Draggable Before & After comparison slider.
   - **Side-by-Side**: Compare original and dressed looks simultaneously.
   - **In-Studio Wardrobe**: Switch garments on your photo without re-uploading.
   - **AI Fit Analysis**: Proportion matching score (e.g. 98% Match) and size recommendations.
   - **1-Click Add to Bag**: Direct checkout from the fitting room.
3. **Full Amazon-Style E-Commerce**:
   - Curated catalog with live search, category filtering, and sorting.
   - Product cards with discount tags, star ratings, and quick try-on overlays.
   - Sliding cart drawer with promo codes (`FITAI20`), price calculations, and simulated checkout.
   - Wishlist management and try-on history archive.
4. **Resilient Dual-Engine AI Backend**:
   - Primary: Hugging Face `yisol/IDM-VTON` remote Gradio neural network.
   - Smart Fallback: Local computer vision try-on compositor ensuring zero downtime even if Hugging Face is slow or unreachable.
   - Auto-fallback database: Connects to MySQL (`fitai_db`), and seamlessly falls back to pre-seeded SQLite (`fitai.db`) if MySQL is offline.

---

## How to Run FitAI

### Option 1: One-Click Launcher (Recommended on Windows)
Simply double-click the **`run_fitai.bat`** file in `C:\Users\emmid\Downloads\FitAI\`. It will automatically:
1. Start the Flask backend on `http://127.0.0.1:5000`
2. Start the Vite React frontend on `http://localhost:5173`
3. Open your browser directly to `http://localhost:5173`

---

### Option 2: Run via Terminal

#### 1. Start the Backend:
```bash
cd backend
.\venv\Scripts\python.exe app.py
```
Backend runs on: `http://127.0.0.1:5000`

#### 2. Start the Frontend:
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`
