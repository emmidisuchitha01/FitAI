
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./VirtualTryOn.css";
import blackJeans from "../assets/Products/black-jeans.jpg";
import kurti from "../assets/Products/kurti.jpg";
import oversizedShirt from "../assets/Products/oversized-shirt.jpg";
import whiteTop from "../assets/Products/white-top.jpg";
import floralMidiDress from "../assets/Products/floral-midi-dress.jpg";
import beigeCoordSet from "../assets/Products/beige-coord-set.jpg";
import beigeTrenchCoat from "../assets/Products/beige-trench-coat.png";
import navyJumpsuit from "../assets/Products/navy-jumpsuit.jpg";

const API_URL = "http://localhost:5000";
const productImages = {
  "black-jeans.jpg": blackJeans,
  "kurti.jpg": kurti,
  "oversized-shirt.jpg": oversizedShirt,
  "white-top.jpg": whiteTop,
  "floral-midi-dress.jpg": floralMidiDress,
  "beige-coord-set.jpg": beigeCoordSet,
  "beige-trench-coat.png": beigeTrenchCoat,
  "navy-jumpsuit.jpg": navyJumpsuit,
};

function VirtualTryOn() {
  const { productId } = useParams();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userImage, setUserImage] = useState("");
  const [userFile, setUserFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setProduct(null);
    setResultImage("");
    setResultMessage("");

    axios
      .get(`${API_URL}/api/products/${productId}`)
      .then((response) => {
        if (!cancelled) setProduct(response.data);
      })
      .catch((err) => {
        console.error("Product loading error:", err);
        if (!cancelled) setError("Unable to load this product.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    return () => {
      if (userImage) URL.revokeObjectURL(userImage);
    };
  }, [userImage]);

  const showMessage = (message, type = "info") => {
    setResultMessage(message);
    setMessageType(type);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please choose a valid image file.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage("Please choose an image smaller than 10 MB.", "error");
      event.target.value = "";
      return;
    }

    setUserImage(URL.createObjectURL(file));
    setUserFile(file);
    setResultImage("");
    showMessage("Photo uploaded successfully!", "success");
  };

  const handleTryOn = async () => {
    if (!userFile) {
      showMessage("Upload your photo before generating your look.", "error");
      return;
    }

    if (!productId) {
      showMessage("Please select a product first.", "error");
      return;
    }

    setProcessing(true);
    setResultImage("");
    showMessage("Creating your virtual look. This may take a little while.");

    const formData = new FormData();
    formData.append("image", userFile);
    formData.append("productId", productId);

    try {
      const response = await axios.post(
  `${API_URL}/api/try-on`,
  formData,
  {
    withCredentials: true,
  }
);

      if (!response.data.resultUrl) {
        throw new Error("The server did not return a result image.");
      }

      const returnedUrl = response.data.resultUrl;
      const url = returnedUrl.startsWith("http")
        ? returnedUrl
        : `${API_URL}${returnedUrl.startsWith("/") ? "" : "/"}${returnedUrl}`;

      setResultImage(
        `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
      );
      showMessage("Your new look is ready!", "success");
    } catch (err) {
      console.error("Try-on error:", err.response?.data || err);

      const message =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message;

      showMessage(
        `We couldn't generate your look. ${message || "Please try again."}`,
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(resultImage);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = "fitai-virtual-try-on.png";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download error:", err);
      window.open(resultImage, "_blank", "noopener,noreferrer");
    }
  };

  const handleTryAgain = () => {
    setResultImage("");
    showMessage("Your photo is ready. Generate another look whenever you're ready.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="fitai-tryon-page">
        <div className="fitai-state">
          <span className="fitai-spinner" />
          <h2>Preparing your fitting room...</h2>
          <p>Getting your selected outfit ready.</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="fitai-tryon-page">
        <div className="fitai-state">
          <span className="fitai-state-icon">!</span>
          <h2>{error || "Product not found."}</h2>
          <p>Please return to the product catalogue and try again.</p>
        </div>
      </main>
    );
  }

  const productImage =
    productImages[product.Image] ||
    `${API_URL}/api/products/image/${encodeURIComponent(product.Image || "")}`;

  return (
    <main className="fitai-tryon-page">
      <section className="fitai-tryon-hero">
        <div className="fitai-hero-copy">
          <span className="fitai-eyebrow">
            <span className="fitai-eyebrow-dot" />
            YOUR PERSONAL VIRTUAL FITTING ROOM
          </span>

          <h1>
            Your style.
            <br />
            <span>Your way.</span>
          </h1>

          <p>
            Meet your next favourite look. Upload a photo, choose your outfit,
            and let FitAI bring your style inspiration to life.
          </p>

          <div className="fitai-hero-note">
            <span>✦</span>
            AI-powered virtual outfit visualization
          </div>
        </div>

        <div className="fitai-hero-art" aria-hidden="true">
          <div className="fitai-art-circle" />
          <div className="fitai-art-label fitai-art-label-top">
            YOUR STYLE, REIMAGINED
          </div>
          <div className="fitai-art-sparkle">✳</div>
          <div className="fitai-art-monogram">F.</div>
          <div className="fitai-art-label fitai-art-label-bottom">
            DISCOVER YOUR LOOK
          </div>
        </div>
      </section>

      <section className="fitai-workspace">
        <div className="fitai-workspace-heading">
          <div>
            <span className="fitai-eyebrow">THE FITTING ROOM</span>
            <h2>Let's try something new.</h2>
          </div>
          <span className="fitai-step-label">01 — UPLOAD & TRY</span>
        </div>

        <div className="fitai-workspace-grid">
          <section className="fitai-panel fitai-upload-panel">
            <div className="fitai-panel-heading">
              <span className="fitai-number">01</span>
              <div>
                <h3>Your photo</h3>
                <p>Start with a photo of yourself.</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              className="fitai-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
            />

            <button
              type="button"
              className={`fitai-upload-area ${userImage ? "has-image" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              aria-label={userImage ? "Change uploaded photo" : "Upload your photo"}
            >
              {userImage ? (
                <>
                  <img
                    src={userImage}
                    alt="Preview of your uploaded photo"
                    className="fitai-user-preview"
                  />
                  <span className="fitai-photo-overlay">
                    <span>↻</span> Change photo
                  </span>
                </>
              ) : (
                <span className="fitai-upload-placeholder">
                  <span className="fitai-upload-icon">↑</span>
                  <strong>Drop into your new look</strong>
                  <span>Choose a photo from your device</span>
                  <span className="fitai-browse-button">Browse photos</span>
                </span>
              )}
            </button>

            <p className="fitai-upload-hint">
              JPG, PNG or WEBP · Maximum 10 MB
            </p>

            <div className="fitai-photo-tip">
              <span>✦</span>
              <p>
                <strong>For the best result</strong>
                <br />
                Use a clear, well-lit, front-facing photo with your body visible.
              </p>
            </div>
          </section>

          <section className="fitai-panel fitai-product-panel">
            <div className="fitai-panel-heading">
              <span className="fitai-number">02</span>
              <div>
                <h3>Your chosen look</h3>
                <p>The piece you're about to try.</p>
              </div>
            </div>

            <div className="fitai-product-image-wrap">
              <img
                src={productImage}
                alt={product.ProductName}
                className="fitai-product-image"
                onError={(event) => {
                  console.error("Product image failed:", product.Image);
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
              <span className="fitai-product-badge">SELECTED PIECE</span>
            </div>

            <div className="fitai-product-details">
              <div>
                <span className="fitai-product-category">
                  YOUR NEXT LOOK
                </span>
                <h3>{product.ProductName}</h3>
              </div>
              <p className="fitai-product-price">
                ₹{Number(product.Price || 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="fitai-product-note">
              <span>✧</span>
              Your selected piece will be used for your virtual try-on.
            </div>
          </section>
        </div>

        <div className="fitai-generate-area">
          <button
            type="button"
            className="fitai-generate-button"
            onClick={handleTryOn}
            disabled={processing}
          >
            {processing ? (
              <>
                <span className="fitai-button-spinner" />
                Creating your look...
              </>
            ) : (
              <>
                <span>✧</span>
                Generate my look
                <span className="fitai-button-arrow">↗</span>
              </>
            )}
          </button>
          <p className="fitai-generate-caption">
            {processing
              ? "Your AI fitting is in progress. Please keep this page open."
              : "Your next look is just one click away."}
          </p>
        </div>

        {resultMessage && (
          <div
            className={`fitai-status fitai-status-${messageType || "info"}`}
            role="status"
            aria-live="polite"
          >
            <span>
              {messageType === "error"
                ? "!"
                : messageType === "success"
                ? "✓"
                : "✧"}
            </span>
            {resultMessage}
          </div>
        )}
      </section>

      {resultImage && (
        <section className="fitai-result-section">
          <div className="fitai-result-heading">
            <span className="fitai-eyebrow">THE REVEAL</span>
            <h2>Your new look awaits.</h2>
            <p>Here's your AI-generated outfit visualization.</p>
          </div>

          <div className="fitai-result-card">
            <div className="fitai-result-image-wrap">
              <img
                src={resultImage}
                alt="Your AI-generated virtual try-on result"
                className="fitai-result-image"
                onError={() => {
                  setResultImage("");
                  showMessage(
                    "The try-on was generated, but its image could not be loaded. Please try again.",
                    "error"
                  );
                }}
              />
              <span className="fitai-result-stamp">FITAI · YOUR LOOK</span>
            </div>

            <div className="fitai-result-details">
              <div>
                <span className="fitai-eyebrow">YOUR VIRTUAL FIT</span>
                <h3>{product.ProductName}</h3>
                <p>Your AI-generated outfit preview is ready.</p>
              </div>

              <div className="fitai-result-actions">
                <button
                  type="button"
                  className="fitai-generate-button fitai-download-button"
                  onClick={handleDownload}
                >
                  ↓ &nbsp; Download image
                </button>
                <button
                  type="button"
                  className="fitai-secondary-button"
                  onClick={handleTryAgain}
                >
                  ↻ &nbsp; Try again
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="fitai-tryon-footer">
        <span className="fitai-footer-logo">FITAI<span>.</span></span>
        <p>Explore your style. Imagine the possibilities.</p>
      </footer>
    </main>
  );
}

export default VirtualTryOn;
