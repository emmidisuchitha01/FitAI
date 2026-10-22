
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ChevronRight,
  X,
} from "lucide-react";
import { useShop } from "../context/ShopContext";
import "./Home.css";

import blackJeans from "../assets/Products/black-jeans.jpg";
import kurti from "../assets/Products/kurti.jpg";
import oversizedShirt from "../assets/Products/oversized-shirt.jpg";
import whiteTop from "../assets/Products/white-top.jpg";
import floralMidiDress from "../assets/Products/floral-midi-dress.jpg";
import beigeCoordSet from "../assets/Products/beige-coord-set.jpg";
import beigeTrenchCoat from "../assets/Products/beige-trench-coat.png";
import navyJumpsuit from "../assets/Products/navy-jumpsuit.jpg";

const fallbackProducts = [
  {
    id: 4,
    name: "Embroidered Floral Anarkali Kurti",
    brand: "Aurelia Ethnics",
    price: 1499,
    image: kurti,
    imageName: "kurti.jpg",
    category: "Ethnic Wear",
    tag: "BESTSELLER",
  },
  {
    id: 2,
    name: "Ribbed Everyday Top",
    brand: "Zara Studio",
    price: 899,
    image: whiteTop,
    imageName: "white-top.jpg",
    category: "Tops",
    tag: "TRENDING",
  },
  {
    id: 1,
    name: "Relaxed Oversized Shirt",
    brand: "H&M Premium",
    price: 1299,
    image: oversizedShirt,
    imageName: "oversized-shirt.jpg",
    category: "Tops",
    tag: "POPULAR",
  },
  {
    id: 3,
    name: "High-Rise Black Jeans",
    brand: "Levi's Original",
    price: 2199,
    image: blackJeans,
    imageName: "black-jeans.jpg",
    category: "Bottoms",
    tag: "",
  },
  {
    id: 5,
    name: "Floral Midi Dress",
    brand: "Style Studio",
    price: 1599,
    image: floralMidiDress,
    imageName: "floral-midi-dress.jpg",
    category: "Dresses",
    tag: "NEW",
  },
  {
    id: 6,
    name: "Beige Co-ord Set",
    brand: "Urban Edit",
    price: 1899,
    image: beigeCoordSet,
    imageName: "beige-coord-set.jpg",
    category: "Co-ord Sets",
    tag: "JUST IN",
  },
  {
    id: 7,
    name: "Classic Beige Trench Coat",
    brand: "The Style Edit",
    price: 2499,
    image: beigeTrenchCoat,
    imageName: "beige-trench-coat.png",
    category: "Outerwear",
    tag: "",
  },
  {
    id: 8,
    name: "Navy Everyday Jumpsuit",
    brand: "Modern Muse",
    price: 1799,
    image: navyJumpsuit,
    imageName: "navy-jumpsuit.jpg",
    category: "Jumpsuits",
    tag: "NEW",
  },
];

const categories = [
  { name: "All", image: null },
  { name: "Dresses", image: floralMidiDress },
  { name: "Tops", image: whiteTop },
  { name: "Ethnic Wear", image: kurti },
  { name: "Bottoms", image: blackJeans },
  { name: "Co-ord Sets", image: beigeCoordSet },
  { name: "Outerwear", image: beigeTrenchCoat },
  { name: "Jumpsuits", image: navyJumpsuit },
];

function Home() {
  const navigate = useNavigate();
  const {
  addToCart,
  wishlist,
  toggleWishlist: toggleSavedWishlist,
  isInWishlist,
} = useShop();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState(fallbackProducts);

  // Keep the original homepage design and images, but load current prices
  // and product details from the same API used by the admin dashboard.
  useEffect(() => {
    let cancelled = false;

    axios
      .get("http://localhost:5000/api/products")
      .then((response) => {
        if (cancelled || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        const byId = new Map(fallbackProducts.map((product) => [product.id, product]));
        const imageByFilename = {
          "black-jeans.jpg": blackJeans,
          "kurti.jpg": kurti,
          "oversized-shirt.jpg": oversizedShirt,
          "white-top.jpg": whiteTop,
          "floral-midi-dress.jpg": floralMidiDress,
          "beige-coord-set.jpg": beigeCoordSet,
          "beige-trench-coat.png": beigeTrenchCoat,
          "navy-jumpsuit.jpg": navyJumpsuit,
        };

        const updatedProducts = response.data.map((item) => {
          const id = Number(item.ProductID ?? item.id);
          const existing = byId.get(id);
          const imageName = String(item.Image ?? existing?.imageName ?? "");
          const category = String(item.Category ?? existing?.category ?? "Other");

          return {
            id,
            name: String(item.ProductName ?? existing?.name ?? "Fashion item"),
            brand: String(item.Brand ?? existing?.brand ?? "FitAI"),
            price: Number(item.Price ?? existing?.price ?? 0),
            imageName,
            image: imageByFilename[imageName] || existing?.image || kurti,
            category,
            tag: existing?.tag ?? "",
          };
        });

        if (!cancelled) setProducts(updatedProducts);
      })
      .catch((error) => {
        // Keep showing the original eight products if the backend is unavailable.
        console.error("Could not load live homepage products:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  

  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  const handleWishlistToggle = (product) => {
  toggleSavedWishlist({
    ProductID: product.id,
    ProductName: product.name,
    Brand: product.brand,
    Price: product.price,
    Image: product.imageName,
    Category: product.category,
  });
};

  const handleAddToBag = (product) => {
    addToCart(
      {
        ProductID: product.id,
        ProductName: product.name,
        Brand: product.brand,
        Price: product.price,
        Image: product.imageName,
      },
      "M",
      1
    );
  };

  return (
    <main className="shop-home">
      {/* Shopping header */}
      <header className="shop-header">
        <Link to="/" className="shop-logo">
          fit<span>ai</span><i>.</i>
        </Link>

        <nav className="shop-nav" aria-label="Main navigation">
          <Link to="/products">SHOP ALL</Link>
          <a href="#shop-categories">CATEGORIES</a>
          <a href="#trending-products">TRENDING</a>
          <Link to="/history">MY LOOKS</Link>
        </nav>

        <div className="shop-header-actions">
          <label className="shop-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search styles..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                document
                  .getElementById("trending-products")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              aria-label="Search products"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <button
            className="shop-icon-button"
            onClick={() => navigate("/history")}
            aria-label="Wishlist and saved looks"
            title="My looks"
          >
            <Heart size={21} />
            {wishlist.length > 0 && (
              <span className="shop-icon-count">{wishlist.length}</span>
            )}
          </button>

          <button
            className="shop-icon-button shop-bag-button"
            onClick={() => navigate("/cart")}
            aria-label="Shopping bag"
            title="Shopping bag"
          >
            <ShoppingBag size={21} />
          </button>
        </div>
      </header>

      {/* Fashion campaign */}
      <section className="shop-campaign">
        <div className="shop-campaign-copy">
          <span className="shop-campaign-kicker">
            <Sparkles size={14} /> THE NEW WAY TO SHOP
          </span>

          <h1>
            Love the look.
            <br />
            <span>Try it on.</span>
          </h1>

          <p>Find your next favourite. See it on you before you buy.</p>

          <div className="shop-campaign-actions">
            <Link to="/products" className="shop-primary-cta">
              Shop the collection <ArrowRight size={17} />
            </Link>
            <Link to="/virtual-try-on/4" className="shop-text-cta">
              Try it virtually <Sparkles size={16} />
            </Link>
          </div>

          <div className="shop-campaign-perks">
            <span><Sparkles size={14} /> AI virtual try-on</span>
            <span><ShoppingBag size={14} /> Shop your style</span>
          </div>
        </div>

        <div className="shop-campaign-visual">
          <img src={kurti} alt="Featured embroidered kurti" />
          <span className="shop-campaign-edition">THE FESTIVE EDIT · 01</span>

          <button
            type="button"
            className="shop-floating-product"
            onClick={() => navigate("/virtual-try-on/4")}
          >
            <img src={kurti} alt="" />
            <span>
              <small>FEATURED LOOK</small>
              <strong>Embroidered Kurti</strong>
              <b>₹{(products.find((product) => product.id === 4)?.price ?? 1499).toLocaleString("en-IN")}</b>
            </span>
            <span className="shop-floating-arrow">
              <ArrowRight size={17} />
            </span>
          </button>
        </div>
      </section>

      {/* Category shopping */}
      <section className="shop-categories" id="shop-categories">
        <div className="shop-section-heading">
          <div>
            <span className="shop-overline">FIND YOUR STYLE</span>
            <h2>Shop by category</h2>
          </div>
          <Link to="/products" className="shop-view-link">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="shop-category-row">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className={`shop-category ${
                activeCategory === category.name ? "active" : ""
              }`}
              onClick={() => {
                setActiveCategory(category.name);
                document
                  .getElementById("trending-products")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="shop-category-image">
                {category.image ? (
                  <img src={category.image} alt="" />
                ) : (
                  <ShoppingBag size={28} />
                )}
              </span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Product collection */}
      <section className="shop-trending" id="trending-products">
        <div className="shop-section-heading">
          <div>
            <span className="shop-overline">THE GOOD STUFF</span>
            <h2>{search ? "Search results" : "Trending right now"}</h2>
          </div>
          <Link to="/products" className="shop-view-link">
            Explore all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="shop-filter-row">
          <div className="shop-filter-chips">
            {["All", "Dresses", "Tops", "Ethnic Wear", "Bottoms", "Co-ord Sets"].map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  className={`shop-filter-chip ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              )
            )}
          </div>
          <span className="shop-result-count">
            {visibleProducts.length} styles
          </span>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="shop-product-grid">
            {visibleProducts.map((product) => (
              <article className="shop-product-card" key={product.id}>
                <div className="shop-product-image">
                  
<button
  type="button"
  className={`shop-wishlist-button ${
    isInWishlist(product.id) ? "selected" : ""
  }`}
  onClick={() => handleWishlistToggle(product)}
  aria-label={
    isInWishlist(product.id)
      ? "Remove from wishlist"
      : "Add to wishlist"
  }
>
  <Heart
    size={18}
    fill={isInWishlist(product.id) ? "currentColor" : "none"}
  />
</button>


                  {product.tag && (
                    <span className="shop-product-tag">{product.tag}</span>
                  )}

                  <button
                    type="button"
                    className="shop-product-image-link"
                    onClick={() => navigate(`/virtual-try-on/${product.id}`)}
                    aria-label={`Try on ${product.name}`}
                  >
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </button>

                  <button
                    type="button"
                    className="shop-tryon-overlay"
                    onClick={() => navigate(`/virtual-try-on/${product.id}`)}
                  >
                    <Sparkles size={15} /> TRY IT ON
                  </button>
                </div>

                <div className="shop-product-info">
                  <span className="shop-product-brand">{product.brand}</span>
                  <h3>{product.name}</h3>
                  <div className="shop-product-bottom">
                    <span className="shop-product-price">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      className="shop-add-bag"
                      onClick={() => handleAddToBag(product)}
                    >
                      <ShoppingBag size={15} /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="shop-empty-results">
            <Search size={30} />
            <h3>No styles found</h3>
            <p>Try another search or browse all categories.</p>
            <button
              type="button"
              className="shop-primary-cta"
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
            >
              Show all products
            </button>
          </div>
        )}
      </section>

      {/* Compact virtual try-on promotion */}
      <section className="shop-tryon-banner">
        <div className="shop-tryon-banner-icon">
          <Sparkles size={25} />
        </div>
        <div>
          <span>YOUR STYLE, YOUR RULES</span>
          <h2>Not sure? Try it on first.</h2>
        </div>
        <Link to="/products" className="shop-banner-cta">
          Find your look <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="shop-footer">
        <Link to="/" className="shop-logo">
          fit<span>ai</span><i>.</i>
        </Link>
        <span>Fashion meets AI.</span>
        <Link to="/products">Shop all styles <ChevronRight size={15} /></Link>
      </footer>
    </main>
  );
}

export default Home;
