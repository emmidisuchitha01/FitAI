import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useShop } from "../context/ShopContext";

// Local garment image map for resilient rendering
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

function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartTotal,
    cartItemCount,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = useShop();

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [orderError, setOrderError] = useState("");

  // Form state for checkout
  
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  paymentMethod: "cod",
});


  if (!isCartOpen) return null;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "FITAI20") {
      setDiscountPercent(20);
      setPromoMessage("✨ 'FITAI20' applied! 20% discount unlocked.");
    } else if (promoCode.trim().toUpperCase() === "TRYON10") {
      setDiscountPercent(10);
      setPromoMessage("✨ 'TRYON10' applied! 10% discount unlocked.");
    } else {
      setPromoMessage("Invalid promo code. Try 'FITAI20'");
    }
  };

  const discountAmount = (cartTotal * discountPercent) / 100;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  
const handlePlaceOrder = async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    setOrderError("Your shopping bag is empty.");
    return;
  }

  setOrderError("");
  


  try {
    const response = await fetch("http://localhost:5000/api/orders", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
      body: JSON.stringify({
        total: finalTotal,
        items: cart,
        shipping: formData,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      setOrderError("Please sign in to place an order. Your bag is still saved.");
      setIsCheckingOut(false);
      setIsCartOpen(false);
      navigate("/login?next=%2F");
      return;
    }
    if (!response.ok || data.success !== true || !data.orderId) {
      throw new Error(data.error || "Unable to place your order.");
    }

    setOrderComplete(data.orderId);
    clearCart();
  } catch (error) {
    setOrderError(
      error.message === "Failed to fetch"
        ? "Cannot connect to the server. Please try again."
        : error.message || "Something went wrong. Please try again."
    );
  }
};


  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag size={22} />
            <h2>Your Shopping Bag</h2>
            <span className="cart-badge-counter">{cartItemCount}</span>
          </div>
          <button
            className="cart-close-btn"
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
              setOrderComplete(null);
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Completed View */}
        {orderComplete ? (
          <div className="order-complete-view">
            <div className="order-success-icon">
              <CheckCircle2 size={56} />
            </div>
            <h3>Thank You for Shopping With FitAI!</h3>
            <p className="order-id-label">
              Order ID: <strong>{orderComplete}</strong>
            </p>
            <p className="order-subtext">
              Your garments have been confirmed and will be dispatched in 2-3 business days. Free returns if it doesn't fit your virtual try-on match!
            </p>
            <button
              className="primary-btn"
              onClick={() => {
                setOrderComplete(null);
                setIsCheckingOut(false);
                setIsCartOpen(false);
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : isCheckingOut ? (
          /* Checkout View */
          <div className="checkout-view-panel">
            <div className="checkout-breadcrumbs">
              <button
                className="back-to-cart-btn"
                onClick={() => setIsCheckingOut(false)}
              >
                ← Back to Bag
              </button>
              <span>Instant Secure Checkout</span>
            </div>

            <form onSubmit={handlePlaceOrder} className="checkout-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Delivery Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>PIN / Postal Code</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === "card"}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: "card" })
                      }
                    />
                    Credit / Debit Card
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === "upi"}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: "upi" })
                      }
                    />
                    UPI / Google Pay
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === "cod"}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: "cod" })
                      }
                    />
                    Cash on Delivery
                  </label>
                </div>
              </div>
              {orderError && (
  <p role="alert" className="promo-message-text">
    {orderError}
  </p>
)}
              <div className="checkout-summary-box">
                <div className="summary-line">
                  <span>Total Payable:</span>
                  <strong>₹{finalTotal.toLocaleString()}</strong>
                </div>
              </div>

              <button type="submit" className="place-order-btn">
                <ShieldCheck size={18} /> Place Order (₹{finalTotal.toLocaleString()})
              </button>
            </form>
          </div>
        ) : (
          /* Cart Items View */
          <>
            <div className="cart-items-scroll">
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <ShoppingBag size={48} className="empty-bag-icon" />
                  <h3>Your shopping bag is empty</h3>
                  <p>Explore our trending catalog and test garments on yourself virtually!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product.ProductID}-${item.size}`}
                    className="cart-item-row"
                  >
                    <img
                      src={
                        productImages[item.product.Image] ||
                        `http://127.0.0.1:5000/api/products/image/${item.product.Image}`
                      }
                      alt={item.product.ProductName}
                      className="cart-item-thumb"
                    />

                    <div className="cart-item-details">
                      <span className="cart-item-brand">{item.product.Brand}</span>
                      <h4 className="cart-item-name">{item.product.ProductName}</h4>
                      <div className="cart-item-meta">
                        <span className="cart-item-size">Size: {item.size}</span>
                        <span className="cart-item-price">₹{item.product.Price}</span>
                      </div>

                      <div className="cart-qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateCartQty(
                              item.product.ProductID,
                              item.size,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateCartQty(
                              item.product.ProductID,
                              item.size,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          className="remove-item-btn"
                          onClick={() =>
                            removeFromCart(item.product.ProductID, item.size)
                          }
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="promo-form">
                  <input
                    type="text"
                    placeholder="Promo code (e.g. FITAI20)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button type="submit">Apply</button>
                </form>
                {promoMessage && (
                  <p className="promo-message-text">{promoMessage}</p>
                )}

                {/* Subtotal Calculations */}
                <div className="cart-summary-calculations">
                  <div className="calc-row">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="calc-row discount-row">
                      <span>Discount ({discountPercent}%)</span>
                      <span>- ₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="calc-row">
                    <span>Estimated Shipping</span>
                    <span className="free-shipping-tag">FREE</span>
                  </div>
                  <div className="calc-row total-row">
                    <span>Estimated Total</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className="checkout-btn"
                  onClick={() => setIsCheckingOut(true)}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
