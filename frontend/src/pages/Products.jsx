import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Sparkles, ShoppingBag, Heart, Star, SlidersHorizontal, Check } from "lucide-react";
import { useShop } from "../context/ShopContext";

// Garment images
import blackJeans from "../assets/Products/black-jeans.jpg";
import kurti from "../assets/Products/kurti.jpg";
import oversizedShirt from "../assets/Products/oversized-shirt.jpg";
import whiteTop from "../assets/Products/white-top.jpg";

import floralMidiDress from "../assets/Products/floral-midi-dress.jpg";
import beigeCoordSet from "../assets/Products/beige-coord-set.jpg";
import beigeTrenchCoat from "../assets/Products/beige-trench-coat.png";
import navyJumpsuit from "../assets/Products/navy-jumpsuit.jpg";


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


const CATEGORIES = [
  "All",
  "Dresses",
  "Tops & Shirts",
  "Bottoms",
  "Ethnic Wear",
  "Co-ord Sets",
  "Outerwear",
  "Jumpsuits",
];



const FALLBACK_PRODUCTS = [
  {
    ProductID: 1,
    ProductName: "Oversized Casual Shirt",
    Brand: "FitAI Collection",
    Price: 999,
    Image: "oversized-shirt.jpg",
    Category: "Tops & Shirts",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "Comfortable oversized casual shirt.",
  },
  {
    ProductID: 2,
    ProductName: "Classic White Top",
    Brand: "FitAI Collection",
    Price: 799,
    Image: "white-top.jpg",
    Category: "Tops & Shirts",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A versatile classic white top.",
  },
  {
    ProductID: 3,
    ProductName: "High-Waist Black Jeans",
    Brand: "FitAI Collection",
    Price: 1499,
    Image: "black-jeans.jpg",
    Category: "Bottoms",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "Stylish high-waist black jeans.",
  },
  {
    ProductID: 4,
    ProductName: "Casual Printed Kurti",
    Brand: "FitAI Collection",
    Price: 1199,
    Image: "kurti.jpg",
    Category: "Ethnic Wear",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A casual printed kurti for everyday wear.",
  },
  {
    ProductID: 5,
    ProductName: "Floral Midi Dress",
    Brand: "FitAI Studio",
    Price: 1599,
    Image: "floral-midi-dress.jpg",
    Category: "Dresses",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A floral midi dress for a stylish look.",
  },
  {
    ProductID: 6,
    ProductName: "Beige Co-ord Set",
    Brand: "FitAI Studio",
    Price: 1899,
    Image: "beige-coord-set.jpg",
    Category: "Co-ord Sets",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A coordinated beige outfit.",
  },
  {
    ProductID: 7,
    ProductName: "Classic Beige Trench Coat",
    Brand: "FitAI Studio",
    Price: 2499,
    Image: "beige-trench-coat.png",
    Category: "Outerwear",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A timeless beige trench coat.",
  },
  {
    ProductID: 8,
    ProductName: "Navy Utility Jumpsuit",
    Brand: "FitAI Studio",
    Price: 1999,
    Image: "navy-jumpsuit.jpg",
    Category: "Jumpsuits",
    Size: "S, M, L, XL",
    Rating: 4.7,
    ReviewsCount: 120,
    Description: "A practical navy utility jumpsuit.",
  },
];


function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  const querySearch = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:5000/api/products")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      })
      .catch(() => {
        setProducts(FALLBACK_PRODUCTS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter & Sort
  const filteredProducts = products.filter((p) => {
    
const productCategory = String(p.Category || "").toLowerCase();

const matchesCategory =
  selectedCategory === "All" ||
  (
    selectedCategory === "Tops & Shirts"
      ? productCategory.includes("tops & shirts") ||
        productCategory === "tops"
      : productCategory === selectedCategory.toLowerCase()
  );


    const matchesSearch =
      !querySearch ||
      String(p.ProductName || "")
        .toLowerCase()
        .includes(querySearch.toLowerCase()) ||
      String(p.Brand || "")
        .toLowerCase()
        .includes(querySearch.toLowerCase()) ||
      String(p.Category || "")
        .toLowerCase()
        .includes(querySearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_low") return a.Price - b.Price;
    if (sortBy === "price_high") return b.Price - a.Price;
    if (sortBy === "rating") return (b.Rating || 0) - (a.Rating || 0);
    return 0; // Popular / default
  });

  return (
    <div className="products-catalog-page">
      {/* Catalog Header Banner */}
      <section className="catalog-header-banner">
        <span className="banner-pill">
          <Sparkles size={14} /> AMAZON & LUXURY FASHION SELECTION
        </span>
        <h1>Curated Fashion Collection</h1>
        <p>
          Every outfit below is calibrated for instant <strong>Virtual Fitting Room</strong> try-on via Webcam or Photo.
        </p>
      </section>

      {/* Filter and Controls Toolbar */}
      <div className="catalog-toolbar-container">
        {/* Category Pills */}
        <div className="category-pills-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort and Status */}
        <div className="sort-controls-box">
          <SlidersHorizontal size={16} />
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {querySearch && (
        <div className="active-search-indicator">
          <span>
            Showing results for <strong>"{querySearch}"</strong>
          </span>
          <button
            onClick={() => {
              searchParams.delete("search");
              setSearchParams(searchParams);
            }}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Products Grid */}
      <section className="catalog-grid-section">
        {loading ? (
          <div className="loading-grid-spinner">
            <Sparkles size={32} className="spin-icon" />
            <p>Loading garments...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="empty-catalog-box">
            <h3>No garments found matching your filters</h3>
            <p>Try clearing your search query or selecting "All" categories.</p>
            <button
              className="secondary-btn"
              onClick={() => {
                setSelectedCategory("All");
                setSearchParams({});
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-cards-grid">
            {sortedProducts.map((product) => {
              const inWish = isInWishlist(product.ProductID);
              return (
                <div key={product.ProductID} className="modern-product-card">
                  {/* Card Image Area */}
                  <div className="card-image-box">
                    <img
                      src={
                        productImages[product.Image] ||
                        `http://127.0.0.1:5000/api/products/image/${product.Image}`
                      }
                      alt={product.ProductName}
                    />

                    {/* Discount badge */}
                    {product.Discount && (
                      <span className="card-discount-badge">
                        {product.Discount}
                      </span>
                    )}

                    {/* Wishlist toggle icon */}
                    <button
                      className={`card-wishlist-trigger ${inWish ? "active" : ""}`}
                      onClick={() => toggleWishlist(product)}
                      title={inWish ? "Remove from Wishlist" : "Save to Wishlist"}
                    >
                      <Heart size={18} />
                    </button>

                    {/* Quick Try On Hover Button */}
                    <button
                      className="card-quick-tryon-overlay"
                      onClick={() =>
                        navigate(`/virtual-try-on/${product.ProductID}`)
                      }
                    >
                      <Sparkles size={16} /> Quick Try-On
                    </button>
                  </div>

                  {/* Card Content Area */}
                  <div className="card-body-content">
                    <span className="product-brand-tag">{product.Brand}</span>
                    <h3
                      className="product-title-heading"
                      onClick={() =>
                        navigate(`/virtual-try-on/${product.ProductID}`)
                      }
                    >
                      {product.ProductName}
                    </h3>

                    {/* Rating row */}
                    <div className="product-rating-row">
                      <div className="rating-stars">
                        <Star size={14} className="star-filled" />
                        <span className="rating-num">{product.Rating || 4.7}</span>
                      </div>
                      <span className="reviews-count">
                        ({product.ReviewsCount || 120} reviews)
                      </span>
                    </div>

                    {/* Price row */}
                    <div className="product-pricing-row">
                      <span className="current-price">₹{product.Price}</span>
                      {product.OriginalPrice && (
                        <span className="original-price">
                          ₹{product.OriginalPrice}
                        </span>
                      )}
                    </div>

                    {/* Available Sizes Tag */}
                    <div className="sizes-available-line">
                      <span>Sizes: {product.Size}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="card-actions-row">
                      <button
                        className="card-tryon-btn"
                        onClick={() =>
                          navigate(`/virtual-try-on/${product.ProductID}`)
                        }
                      >
                        <Sparkles size={15} /> Try On
                      </button>

                      <button
                        className="card-addbag-btn"
                        onClick={() => addToCart(product, "M", 1)}
                        title="Add to Shopping Bag"
                      >
                        <ShoppingBag size={16} /> Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;