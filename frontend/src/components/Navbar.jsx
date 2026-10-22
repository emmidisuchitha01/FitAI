
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Heart,
  Sparkles,
  Menu,
  X,
  Clock,
  UserRound,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useShop } from "../context/ShopContext";
import { authRequest } from "../authApi";

function Navbar() {
  const navigate = useNavigate();
  const { cartItemCount, wishlist, setIsCartOpen } = useShop();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const accountRef = useRef(null);

  useEffect(() => {
    let active = true;

    authRequest("/api/auth/me")
      .then((data) => {
        if (active) setAuthUser(data.user || null);
      })
      .catch(() => {
        if (active) setAuthUser(null);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authRequest("/api/auth/logout", { method: "POST" });
      setAuthUser(null);
      setAccountOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
      window.alert("Could not sign out. Please try again.");
    }
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
  };

  return (
    <>
      <div className="top-notice-bar">
        <span>
          ✨ <strong>AI Virtual Dressing Room</strong>: Try any dress using
          your <strong>Webcam</strong> or <strong>Photo Upload</strong> before
          buying!
        </span>
      </div>

      <header className="main-navbar-header">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/" onClick={closeMenus}>
              <span className="logo-main">
                FIT<span>AI</span>
              </span>
              <span className="logo-badge">STUDIO</span>
            </Link>
          </div>

          {/* Search */}
          <form className="navbar-search-bar" onSubmit={handleSearchSubmit}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search kurtis, shirts, dresses, jeans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

            <button type="submit" className="search-submit-btn">
              Search
            </button>
          </form>

          {/* Main navigation */}
          <nav className={`navbar-nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <Link to="/" className="nav-link" onClick={closeMenus}>
              Home
            </Link>

            <Link to="/products" className="nav-link" onClick={closeMenus}>
              Shop Collection
            </Link>

            <Link
              to="/virtual-try-on"
              className="nav-link tryon-studio-cta"
              onClick={closeMenus}
            >
              <Sparkles size={16} className="sparkle-anim" />
              Virtual Dressing Room
            </Link>

            <Link to="/history" className="nav-link" onClick={closeMenus}>
              <Clock size={15} />
              My Try-Ons
            </Link>

            <Link to="/my-orders" className="nav-link" onClick={closeMenus}>
              <ShoppingBag size={15} />
              My Orders
            </Link>
          </nav>

          {/* Right-side actions */}
          <div className="navbar-action-icons">
            <Link
              to="/wishlist"
              className="icon-action-btn"
              title="Saved Wishlist"
              aria-label="Saved Wishlist"
              onClick={closeMenus}
            >
              <Heart size={21} />
              {wishlist.length > 0 && (
                <span className="action-badge-count">{wishlist.length}</span>
              )}
            </Link>

            <button
              className="icon-action-btn cart-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              title="View Shopping Bag"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag size={21} />
              {cartItemCount > 0 && (
                <span className="action-badge-count">{cartItemCount}</span>
              )}
            </button>

            {/* Account menu */}
            <div className="navbar-account" ref={accountRef}>
              <button
                type="button"
                className="icon-action-btn account-trigger-btn"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                title="My Account"
              >
                <UserRound size={21} />
                <ChevronDown size={13} className="account-chevron" />
              </button>

              {accountOpen && (
                <div className="account-dropdown">
                  {authChecked && authUser ? (
                    <>
                      <div className="account-dropdown-header">
                        <span className="account-user-icon">
                          <UserRound size={20} />
                        </span>
                        <div className="account-user-details">
                          <strong>{authUser.FullName}</strong>
                          <span>{authUser.Email}</span>
                          <small>
                            {authUser.Role === "admin"
                              ? "Administrator"
                              : "FitAI member"}
                          </small>
                        </div>
                      </div>

                      {authUser.Role === "admin" && (
                        <Link
                          to="/admin"
                          className="account-dropdown-item"
                          onClick={closeMenus}
                        >
                          <LayoutDashboard size={17} />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        type="button"
                        className="account-dropdown-item account-logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={17} />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="account-dropdown-heading">
                        <strong>Welcome to FitAI</strong>
                        <span>Sign in to your style account.</span>
                      </div>

                      <Link
                        to="/login"
                        className="account-dropdown-primary"
                        onClick={closeMenus}
                      >
                        Sign in
                      </Link>

                      <Link
                        to="/register"
                        className="account-dropdown-register"
                        onClick={closeMenus}
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;