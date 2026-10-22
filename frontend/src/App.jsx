
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ShopProvider } from "./context/ShopContext";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Toast from "./components/Toast";

import Home from "./pages/Home";
import Products from "./pages/Products";
import VirtualTryOn from "./pages/VirtualTryOn";
import History from "./pages/History";
import Wishlist from "./pages/Wishlist";
import MyOrders from "./pages/MyOrders";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import { authRequest } from "./authApi";

import "./App.css";

// Shared authentication context
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  async function refreshAuth() {
    try {
      const response = await authRequest("/api/auth/me");
      setAuthUser(response.user || null);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthChecked(true);
    }
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <ShopProvider>
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            authUser,
            setAuthUser,
            refreshAuth,
            authChecked,
          }}
        >
          <div className="fitai-app-root">
            <Navbar />
            <CartDrawer />
            <Toast />

            <main className="fitai-main-viewport">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />

                <Route
                  path="/virtual-try-on"
                  element={<VirtualTryOn />}
                />
                <Route
                  path="/virtual-try-on/:productId"
                  element={<VirtualTryOn />}
                />

                <Route path="/history" element={<History />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/my-orders" element={<MyOrders />} />

                <Route
                  path="/login"
                  element={
                    <AuthPage
                      mode="login"
                      onAuthenticated={(user) => {
                        setAuthUser(user);
                      }}
                    />
                  }
                />

                <Route
                  path="/register"
                  element={
                    <AuthPage
                      mode="register"
                      onAuthenticated={(user) => {
                        setAuthUser(user);
                      }}
                    />
                  }
                />

                <Route
                  path="/admin"
                  element={
                    !authChecked ? (
                      <p>Loading account...</p>
                    ) : authUser?.Role === "admin" ? (
                      <AdminDashboard />
                    ) : (
                      <Navigate
                        to="/login?next=%2Fadmin"
                        replace
                      />
                    )
                  }
                />
              </Routes>
            </main>

            <footer className="fitai-footer">
              <div className="footer-content-inner">
                <div className="footer-brand">
                  <span className="logo-main">
                    FIT<span>AI</span>
                  </span>
                  <p>
                    AI Virtual Dressing Room &amp; Intelligent Fashion
                    Discovery. Try any outfit before buying.
                  </p>
                </div>

                <div className="footer-links">
                  <h4>Virtual Experience</h4>
                  <a href="/virtual-try-on">Webcam Fitting Room</a>
                  <a href="/virtual-try-on">Photo Upload Studio</a>
                  <a href="/products">Curated Catalog</a>
                </div>

                <div className="footer-links">
                  <h4>Customer Support</h4>
                  <a href="#returns">Free Doorstep Returns</a>
                  <a href="#sizing">Smart Size Guide</a>
                  <a href="#privacy">Camera Privacy Policy</a>
                </div>
              </div>

              <div className="footer-bottom-line">
                <p>
                  © 2026 FitAI Technologies. All rights reserved.
                  Crafted for effortless virtual fashion.
                </p>
              </div>
            </footer>
          </div>
        </AuthContext.Provider>
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;