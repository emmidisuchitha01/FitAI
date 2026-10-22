import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Sparkles, ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "../context/ShopContext";

import blackJeans from "../assets/Products/black-jeans.jpg";
import kurti from "../assets/Products/kurti.jpg";
import oversizedShirt from "../assets/Products/oversized-shirt.jpg";
import whiteTop from "../assets/Products/white-top.jpg";

const productImages = {
  "black-jeans.jpg": blackJeans,
  "kurti.jpg": kurti,
  "oversized-shirt.jpg": oversizedShirt,
  "white-top.jpg": whiteTop,
};

function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addToCart } = useShop();

  return (
    <div className="wishlist-page-wrapper">
      <div className="wishlist-header-banner">
        <span className="wishlist-tag">
          <Heart size={15} /> YOUR CURATED LOOKS
        </span>
        <h1>My Saved Wishlist</h1>
        <p>
          Save your favorite garments here and test them anytime in the Virtual Dressing Room.
        </p>
      </div>

      <div className="wishlist-content-container">
        {wishlist.length === 0 ? (
          <div className="wishlist-empty-card">
            <div className="empty-icon-circle">
              <Heart size={40} />
            </div>
            <h3>Your Wishlist is Empty</h3>
            <p>
              Tap the heart icon on any garment in our shop to save it here for quick access and virtual try-on.
            </p>
            <Link to="/products" className="start-shopping-btn">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="wishlist-items-grid">
            {wishlist.map((item) => (
              <div key={item.ProductID} className="wishlist-card-item">
                <div className="wishlist-media-box">
                  <img
                    src={
                      productImages[item.Image] ||
                      `http://127.0.0.1:5000/api/products/image/${item.Image}`
                    }
                    alt={item.ProductName}
                  />
                  <button
                    className="remove-wishlist-btn"
                    onClick={() => toggleWishlist(item)}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="wishlist-card-body">
                  <span className="wishlist-brand">{item.Brand}</span>
                  <h3>{item.ProductName}</h3>
                  <div className="price-tag">₹{item.Price}</div>

                  <div className="wishlist-action-row">
                    <button
                      className="tryon-wishlist-btn"
                      onClick={() =>
                        navigate(`/virtual-try-on/${item.ProductID}`)
                      }
                    >
                      <Sparkles size={15} /> Try On
                    </button>
                    <button
                      className="move-bag-btn"
                      onClick={() => addToCart(item, "M", 1)}
                    >
                      <ShoppingBag size={15} /> Move to Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
