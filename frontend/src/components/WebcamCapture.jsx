import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Check, Sparkles, SwitchCamera, Eye, EyeOff } from "lucide-react";

function WebcamCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [showSilhouette, setShowSilhouette] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera access was denied or is not supported. Please allow camera permissions in your browser or switch to the Photo Upload tab."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const playShutterSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const startCountdownCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          captureSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 250);

    const base64Data = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(base64Data);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "webcam_snap.jpg", { type: "image/jpeg" });
          setCapturedImage((prev) => ({ base64: base64Data, blob, file }));
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (!stream) {
      startCamera();
    }
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    stopCamera();
    onCapture(capturedImage.file, capturedImage.base64);
  };

  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="webcam-container">
      {cameraError ? (
        <div className="camera-error-banner">
          <p>{cameraError}</p>
          <button className="secondary-btn" onClick={startCamera}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      ) : capturedImage ? (
        <div className="webcam-preview-box">
          <img
            src={capturedImage.base64 || capturedImage}
            alt="Webcam Snapshot"
            className="snapshot-preview-img"
          />
          <div className="snapshot-action-bar">
            <button className="retake-btn" onClick={handleRetake}>
              <RefreshCw size={16} /> Retake
            </button>
            <button className="confirm-btn" onClick={handleConfirm}>
              <Check size={18} /> Use This Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="webcam-live-box">
          <div className={`shutter-flash ${isFlashing ? "active" : ""}`} />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`webcam-video-feed ${facingMode === "user" ? "mirrored" : ""}`}
          />

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Silhouette Pose Alignment Overlay */}
          {showSilhouette && (
            <div className="silhouette-guide-overlay">
              <svg viewBox="0 0 200 300" className="silhouette-svg">
                {/* Head outline */}
                <ellipse cx="100" cy="50" rx="26" ry="32" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeDasharray="5,5" />
                {/* Neck and Shoulders */}
                <path
                  d="M86,80 Q100,85 114,80 M72,95 C45,108 30,135 25,180 M128,95 C155,108 170,135 175,180"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* Torso */}
                <path
                  d="M48,150 Q45,210 55,270 M152,150 Q155,210 145,270"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
              <span className="silhouette-tip">Align shoulders & torso within guide</span>
            </div>
          )}

          {/* Countdown Display */}
          {countdown !== null && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="webcam-controls-bar">
            <button
              className="icon-ctrl-btn"
              onClick={() => setShowSilhouette(!showSilhouette)}
              title={showSilhouette ? "Hide Body Alignment Guide" : "Show Body Alignment Guide"}
            >
              {showSilhouette ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <button
              className="shutter-button"
              onClick={startCountdownCapture}
              disabled={countdown !== null}
              title="Capture Snapshot with 3-Second Timer"
            >
              <div className="shutter-inner">
                <Camera size={26} />
              </div>
            </button>

            <button
              className="icon-ctrl-btn"
              onClick={toggleFacing}
              title="Flip Camera"
            >
              <SwitchCamera size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebcamCapture;
