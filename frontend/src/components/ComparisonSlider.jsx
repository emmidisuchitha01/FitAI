import React, { useState, useRef, useEffect, useCallback } from "react";
import { SlidersHorizontal, Columns2, Sparkles, Download } from "lucide-react";

function ComparisonSlider({ beforeImage, afterImage, productName }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState("slider"); // "slider" | "side-by-side"
  const containerRef = useRef(null);

  const handleMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let pos = (x / rect.width) * 100;
      if (pos < 0) pos = 0;
      if (pos > 100) pos = 100;
      setSliderPosition(pos);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="comparison-slider-wrapper">
      {/* Mode Switcher */}
      <div className="comparison-mode-bar">
        <div className="mode-pill-group">
          <button
            className={`mode-pill ${viewMode === "slider" ? "active" : ""}`}
            onClick={() => setViewMode("slider")}
          >
            <SlidersHorizontal size={15} /> Split Slider
          </button>
          <button
            className={`mode-pill ${viewMode === "side-by-side" ? "active" : ""}`}
            onClick={() => setViewMode("side-by-side")}
          >
            <Columns2 size={15} /> Side-by-Side
          </button>
        </div>

        <a
          href={afterImage}
          download={`${productName || "fitai"}_tryon.png`}
          className="download-pill-btn"
          target="_blank"
          rel="noreferrer"
        >
          <Download size={14} /> Save Look
        </a>
      </div>

      {viewMode === "slider" ? (
        <div
          ref={containerRef}
          className="comparison-slider-container"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* After (Dressed) Image - Base layer */}
          <img
            src={afterImage}
            alt="FitAI Virtual Try-On Result"
            className="slider-image after-image"
            draggable={false}
          />

          {/* Before (Original) Image - Clipped layer */}
          <div
            className="slider-image-clip"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeImage}
              alt="Original User Photo"
              className="slider-image before-image"
              draggable={false}
            />
          </div>

          {/* Slider Divider Line & Handle */}
          <div
            className="slider-divider"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-handle">
              <span className="handle-chevron">‹</span>
              <span className="handle-chevron">›</span>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="badge-before">Original</div>
          <div className="badge-after">
            <Sparkles size={13} /> FitAI Look
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="side-by-side-grid">
          <div className="side-card">
            <div className="side-card-header">Original You</div>
            <img
              src={beforeImage}
              alt="Original User Photo"
              className="side-card-img"
            />
          </div>
          <div className="side-card featured">
            <div className="side-card-header">
              <Sparkles size={14} /> FitAI Try-On
            </div>
            <img
              src={afterImage}
              alt="FitAI Virtual Try-On Result"
              className="side-card-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ComparisonSlider;
