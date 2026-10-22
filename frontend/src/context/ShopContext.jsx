import React, { createContext, useContext, useState, useEffect } from "react";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  // Cart state persisted to localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("fitai_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state persisted to localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("fitai_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart Drawer open/close state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active product selected for Dressing Room
  const [activeDressingProduct, setActiveDressingProduct] = useState(null);

  // Quick view product modal state
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Global Toast notification
  const [toast, setToast] = useState(null);

  // Local session try-on results
  const [tryOnHistory, setTryOnHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("fitai_tryon_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fitai_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("fitai_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("fitai_tryon_history", JSON.stringify(tryOnHistory));
  }, [tryOnHistory]);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const addToCart = (product, size = "M", quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.ProductID === product.ProductID && item.size === size
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { product, size, quantity }];
    });
    showToast(`Added "${product.ProductName}" to your shopping bag!`, "success");
    setIsCartOpen(true);
  };

  const updateCartQty = (productId, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.ProductID === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.ProductID === productId && item.size === size)
      )
    );
    showToast("Item removed from your bag.", "info");
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.ProductID === product.ProductID);
      if (exists) {
        showToast(`Removed "${product.ProductName}" from Wishlist.`, "info");
        return prev.filter((p) => p.ProductID !== product.ProductID);
      } else {
        showToast(`Saved "${product.ProductName}" to Wishlist!`, "success");
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => p.ProductID === productId);
  };

  const addTryOnRecord = (record) => {
  setTryOnHistory((prev) => [record, ...prev]);
};

const removeTryOnRecord = (record) => {
  setTryOnHistory((prev) =>
    prev.filter((item) => {
      if (record.id != null && item.id === record.id) return false;

      if (
        record.HistoryID != null &&
        item.HistoryID === record.HistoryID
      ) {
        return false;
      }

      if (
        record.resultUrl &&
        item.resultUrl === record.resultUrl
      ) {
        return false;
      }

      return true;
    })
  );
};

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product.Price || 0) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        cart,
        cartItemCount,
        cartTotal,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        activeDressingProduct,
        setActiveDressingProduct,
        quickViewProduct,
        setQuickViewProduct,
        tryOnHistory,
        addTryOnRecord,
        removeTryOnRecord,
        toast,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
