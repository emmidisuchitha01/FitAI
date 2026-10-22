
import React, { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  Truck,
  PackageCheck,
} from "lucide-react";

const API_URL = "http://127.0.0.1:5000";

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN")}`;
}

function OrderTracking({ status }) {
  const stages = [
    { label: "Processing", icon: CheckCircle2 },
    { label: "Shipped", icon: Truck },
    { label: "Delivered", icon: PackageCheck },
  ];

  const normalizedStatus = String(status || "Processing").toLowerCase();

  const activeStage =
    normalizedStatus === "delivered"
      ? 2
      : normalizedStatus === "shipped" ||
        normalizedStatus === "out for delivery"
      ? 1
      : 0;

  const progress =
    normalizedStatus === "delivered"
      ? "100%"
      : activeStage === 1
      ? "50%"
      : "0%";

  return (
    <div className="order-tracking">
      <div className="tracking-track">
        <div
          className="tracking-progress"
          style={{ width: progress }}
        />
      </div>

      <div className="tracking-stages">
        {stages.map((stage, index) => {
          const StageIcon = stage.icon;
          const completed = index <= activeStage;

          return (
            <div
              className={`tracking-stage ${
                completed ? "completed" : ""
              }`}
              key={stage.label}
            >
              <StageIcon size={21} />
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/orders`, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Unable to load your orders.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setOrders(data);
    } catch (err) {
      setError(err.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="my-orders-page">
      <div className="my-orders-heading">
        <span className="my-orders-eyebrow">YOUR FITAI ACCOUNT</span>
        <h1>My Orders</h1>
        <p>Track your purchases and revisit your order details.</p>
      </div>

      {loading && (
        <div className="my-orders-message">
          Loading your orders...
        </div>
      )}

      {!loading && error && (
        <div className="my-orders-message">
          <p>{error}</p>
          <button onClick={fetchOrders}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="my-orders-empty">
          <Package size={48} />
          <h2>No orders yet</h2>
          <p>Your purchases will appear here after you place an order.</p>
          <a href="/products">Explore Products</a>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="my-orders-list">
          {orders.map((order) => {
            let items = Array.isArray(order.Items) ? order.Items : [];

            return (
              <article
                className="my-order-card"
                key={order.OrderID}
              >
                <div className="my-order-top">
                  <div>
                    <span className="my-order-label">ORDER ID</span>
                    <h2>#{order.OrderID}</h2>
                  </div>

                  <span className="my-order-status">
                    {order.Status || "Processing"}
                  </span>
                </div>

                <div className="my-order-meta">
                  <span>
                    <CalendarDays size={16} />
                    {order.OrderDate
                      ? new Date(
                          order.OrderDate.replace(" ", "T") + "Z"
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date unavailable"}
                  </span>

                  <span>
                    <Package size={16} />
                    {order.ItemsCount} item(s)
                  </span>
                </div>
                <OrderTracking status={order.Status} />
                <div className="my-order-products">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div
                        className="my-order-product"
                        key={`${item.productId || item.productName}-${index}`}
                      >
                        
<div className="my-order-product-icon">
  {item.image ? (
    <img
      src={`${API_URL}/api/products/image/${encodeURIComponent(item.image)}`}
      alt={item.productName || "Purchased product"}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <Package size={22} />
  )}
</div>


                        <div className="my-order-product-info">
                          <h3>{item.productName || "Fashion product"}</h3>
                          <p>
                            Size: {item.size || "M"} · Qty: {item.quantity}
                          </p>
                          <span>
                            {formatPrice(item.unitPrice)} each
                          </span>
                        </div>

                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="my-order-old-note">
                      Product details are unavailable for this older order.
                    </p>
                  )}
                </div>

                <div className="my-order-delivery">
                  <MapPin size={18} />
                  <div>
                    <strong>Delivery Address</strong>
                    <p>
                      {[
                        order.Address,
                        order.City,
                        order.PostalCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Address not available"}
                    </p>
                  </div>
                </div>

                <div className="my-order-bottom">
                  <div>
                    <span>Payment</span>
                    <strong>
                      {order.PaymentMethod
                        ? order.PaymentMethod === "cod"
                          ? "Cash on Delivery"
                          : order.PaymentMethod.toUpperCase()
                        : "Not available"}
                    </strong>
                  </div>

                  <div className="my-order-total">
                    <span>Order Total</span>
                    <strong>{formatPrice(order.TotalAmount)}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
