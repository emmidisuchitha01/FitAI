
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useShop } from "../context/ShopContext";

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

function History() {
  const navigate = useNavigate();
  const { addToCart } = useShop();

  const [serverHistory, setServerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/history`, { withCredentials: true });
      setServerHistory(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Could not load server history:", err);
      setMessage("Unable to load saved try-on history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const deleteTryOn = async (item) => {
    if (!item.HistoryID) return;
    const confirmed = window.confirm(
      "Delete this try-on from your history? This will not delete the product."
    );
    if (!confirmed) return;

    setDeletingId(item.HistoryID);
    setMessage("");
    try {
      await axios.delete(
        `${API_URL}/api/history/${item.HistoryID}`,
        { withCredentials: true }
      );
      setServerHistory((current) =>
        current.filter((entry) => entry.HistoryID !== item.HistoryID)
      );
      setMessage("Try-on removed from your history.");
    } catch (err) {
      console.error("Could not delete try-on:", err);
      setMessage(
        err.response?.data?.error ||
          "Could not delete this try-on. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Only render server history for the authenticated account. Local session
  // history may have been created before login or by a different account.
  const allHistory = serverHistory;

  return (
    <div className="history-page-wrapper">
      <div className="history-header-banner">
        <span className="history-tag">
          <Clock size={15} /> YOUR VIRTUAL FITTING ARCHIVE
        </span>

        <h1>My Try-On History</h1>

        <p>
          Review and compare all the garments you've tested in the
          FitAI Virtual Dressing Room.
        </p>
      </div>

      <div className="history-content-container">
        {message && (
          <p className="history-status-message" role="status">
            {message}
          </p>
        )}

        {loading && allHistory.length === 0 ? (
          <div className="history-loading-spinner">
            <Sparkles size={32} className="spin-icon" />
            <p>Loading your try-on archive...</p>
          </div>
        ) : allHistory.length === 0 ? (
          <div className="history-empty-card">
            <div className="empty-icon-circle">
              <Sparkles size={40} />
            </div>

            <h3>No Try-On History Yet</h3>

            <p>
              You haven't tested any outfits in the dressing room yet.
              Choose a garment and try it on using your photo!
            </p>

            <Link
              to="/virtual-try-on"
              className="start-tryon-btn"
            >
              <Sparkles size={16} /> Open Virtual Dressing Room
            </Link>
          </div>
        ) : (
          <div className="history-items-grid">
            {allHistory.map((item, index) => {
              const prod = item.product || {
                ProductID: item.ProductID,
                ProductName: item.ProductName || "Fashion Garment",
                Brand: item.Brand || "FitAI Partner",
                Price: item.Price ?? 1299,
                Image: item.Image,
              };

              const imageSrc =
                item.resultUrl ||
                (item.OverlayResult
                  ? `${API_URL}/api/try-on/result/${item.OverlayResult}`
                  : null) ||
                productImages[prod.Image] ||
                (prod.Image
                  ? `${API_URL}/api/products/image/${encodeURIComponent(
                      prod.Image
                    )}`
                  : "");

              return (
                <div
                  key={item.HistoryID || item.id || `local-${index}`}
                  className="history-card-item"
                >
                  <div className="history-card-media-box">
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={prod.ProductName}
                        className="history-result-img"
                      />
                    )}

                    <div className="history-fit-chip">
                      <CheckCircle2 size={13} />{" "}
                      {item.fitScore ?? item.FitScore ?? 97}% Fit Match
                    </div>
                  </div>

                  <div className="history-card-body">
                    <span className="history-brand">
                      {prod.Brand}
                    </span>

                    <h3>{prod.ProductName}</h3>

                    <div className="history-price-line">
                      <span className="price">₹{prod.Price}</span>

                      <span className="date-stamp">
                        {item.date ||
                          (item.TryOnDate
                            ? new Date(
                                item.TryOnDate
                              ).toLocaleDateString()
                            : "Recent")}
                      </span>
                    </div>

                    <div className="history-action-row">
                      <button
                        className="retry-btn"
                        onClick={() =>
                          navigate(
                            `/virtual-try-on/${prod.ProductID}`
                          )
                        }
                      >
                        <Sparkles size={15} /> Try Again
                      </button>

                      <button
                        className="add-cart-history-btn"
                        onClick={() => addToCart(prod, "M", 1)}
                        title="Add to Shopping Bag"
                      >
                        <ShoppingBag size={15} /> Add to Bag
                      </button>
                    </div>

                    <button
                      className="delete-history-btn"
                      onClick={() => deleteTryOn(item)}
                      disabled={
                        !item.HistoryID ||
                        deletingId === item.HistoryID
                      }
                      title="Delete this saved try-on"
                    >
                      <Trash2 size={15} />
                      {deletingId === item.HistoryID
                        ? "Deleting..."
                        : "Delete Try-On"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
