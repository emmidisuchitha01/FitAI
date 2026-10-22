
import os
import re
import uuid
import base64
import sqlite3
import logging
import json

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

from tryon_service import run_virtual_tryon

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

from auth_module import auth_bp, init_auth_tables, login_required, get_user

app.config["SECRET_KEY"] = os.getenv(
    "FITAI_SECRET_KEY",
    "local-only-change-this-secret"
)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = (
    os.getenv("FITAI_HTTPS", "0") == "1"
)

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
)

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

DB_SQLITE_PATH = os.path.join(app.root_path, "fitai.db")

PRODUCTS_DIR = os.path.join(
    os.path.dirname(app.root_path),
    "frontend", "src", "assets", "Products"
)
logger.info("Products image folder: %s", PRODUCTS_DIR)
logger.info("Products folder exists: %s", os.path.isdir(PRODUCTS_DIR))
SEED_PRODUCTS = [
    {
        "ProductID": 1,
        "ProductName": "Embroidered Floral Anarkali Kurti",
        "Brand": "Aurelia Ethnics",
        "Price": 1499,
        "OriginalPrice": 2499,
        "Discount": "40% OFF",
        "Image": "kurti.jpg",
        "Category": "Kurtis & Ethnic",
        "Size": "S, M, L, XL",
        "Rating": 4.8,
        "ReviewsCount": 142,
        "Description": "Graceful handcrafted anarkali kurti featuring delicate floral embroidery.",
        "InStock": True,
        "Fabric": "Pure Cotton",
        "Color": "Crimson & Rose"
    },
    {
        "ProductID": 2,
        "ProductName": "Ribbed Sweetheart Fitted Top",
        "Brand": "Zara Studio",
        "Price": 899,
        "OriginalPrice": 1499,
        "Discount": "40% OFF",
        "Image": "white-top.jpg",
        "Category": "Tops & Shirts",
        "Size": "XS, S, M, L",
        "Rating": 4.6,
        "ReviewsCount": 98,
        "Description": "Chic ribbed-knit sweetheart top with sculpted neckline.",
        "InStock": True,
        "Fabric": "Cotton Rib Blend",
        "Color": "Ivory White"
    },
    {
        "ProductID": 3,
        "ProductName": "Classic Relaxed Oversized Shirt",
        "Brand": "H&M Premium",
        "Price": 1299,
        "OriginalPrice": 1999,
        "Discount": "35% OFF",
        "Image": "oversized-shirt.jpg",
        "Category": "Tops & Shirts",
        "Size": "S, M, L, XL",
        "Rating": 4.7,
        "ReviewsCount": 215,
        "Description": "Timeless relaxed poplin shirt crafted with drop shoulders.",
        "InStock": True,
        "Fabric": "100% Organic Poplin",
        "Color": "Sky Blue Stripe"
    },
    {
        "ProductID": 4,
        "ProductName": "Sculpt High-Rise Slim Fit Jeans",
        "Brand": "Levi's Original",
        "Price": 2199,
        "OriginalPrice": 3299,
        "Discount": "33% OFF",
        "Image": "black-jeans.jpg",
        "Category": "Jeans & Bottoms",
        "Size": "28, 30, 32, 34",
        "Rating": 4.9,
        "ReviewsCount": 380,
        "Description": "Signature shape-sculpting black denim.",
        "InStock": True,
        "Fabric": "Premium Stretch Denim",
        "Color": "Midnight Black"
    }
]


def init_sqlite_db():
    conn = sqlite3.connect(DB_SQLITE_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            ProductID INTEGER PRIMARY KEY,
            ProductName TEXT NOT NULL,
            Brand TEXT,
            Price REAL,
            OriginalPrice REAL,
            Discount TEXT,
            Image TEXT,
            Category TEXT,
            Size TEXT,
            Rating REAL,
            ReviewsCount INTEGER,
            Description TEXT,
            InStock INTEGER,
            Fabric TEXT,
            Color TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS virtual_try_on (
            TryOnID INTEGER PRIMARY KEY AUTOINCREMENT,
            ImageInput TEXT,
            OverlayResult TEXT,
            UserID INTEGER,
            ProductID INTEGER,
            FitScore REAL,
            Engine TEXT,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS try_on_history (
            HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER,
            ProductID INTEGER,
            ImageInput TEXT,
            OverlayResult TEXT,
            FitScore REAL,
            TryOnDate DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER,
            TotalAmount REAL,
            ItemsCount INTEGER,
            Status TEXT,
            OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add checkout details to existing orders tables safely.
    # Existing orders will remain unchanged.
    cursor.execute("PRAGMA table_info(orders)")
    existing_columns = {
        row[1] for row in cursor.fetchall()
    }

    new_columns = {
        "FullName": "TEXT",
        "Email": "TEXT",
        "Address": "TEXT",
        "City": "TEXT",
        "PostalCode": "TEXT",
        "PaymentMethod": "TEXT",
        "ItemsJSON": "TEXT"
    }

    for column_name, column_type in new_columns.items():
        if column_name not in existing_columns:
            cursor.execute(
                f"ALTER TABLE orders ADD COLUMN {column_name} {column_type}"
            )

    conn.commit()


    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        for p in SEED_PRODUCTS:
            cursor.execute("""
                INSERT INTO products (
                    ProductID, ProductName, Brand, Price,
                    OriginalPrice, Discount, Image, Category,
                    Size, Rating, ReviewsCount, Description,
                    InStock, Fabric, Color
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["ProductID"], p["ProductName"], p["Brand"],
                p["Price"], p["OriginalPrice"], p["Discount"],
                p["Image"], p["Category"], p["Size"], p["Rating"],
                p["ReviewsCount"], p["Description"],
                int(p["InStock"]), p["Fabric"], p["Color"]
            ))

        conn.commit()

    conn.close()


init_sqlite_db()
init_auth_tables()
app.register_blueprint(auth_bp)

def get_mysql_connection():
    try:
        import mysql.connector

        return mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "fitai_db"),
            port=int(os.getenv("DB_PORT", 3306)),
            connection_timeout=2
        )
    except Exception as e:
        logger.debug("MySQL not reachable; using SQLite: %s", e)
        return None



def fetch_products_db():
    """Fetch MySQL products with category names for the frontend."""
    mysql_conn = get_mysql_connection()

    if mysql_conn:
        try:
            cursor = mysql_conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    p.ProductID,
                    p.ProductName,
                    p.Brand,
                    p.Price,
                    p.Image,
                    p.Size,
                    p.CategoryID,
                    p.AdminID,
                    c.CategoryName,
                    CASE
                        WHEN c.CategoryName = 'Tops'
                            THEN 'Tops & Shirts'
                        WHEN c.CategoryName = 'Ethnic Wear'
                            THEN 'Ethnic Wear'
                        WHEN c.CategoryName = 'Bottoms'
                            THEN 'Bottoms'
                        ELSE c.CategoryName
                    END AS Category,
                    4.7 AS Rating,
                    120 AS ReviewsCount
                FROM products p
                LEFT JOIN categories c
                    ON p.CategoryID = c.CategoryID
                ORDER BY p.ProductID ASC
            """)

            rows = cursor.fetchall()
            cursor.close()
            mysql_conn.close()

            if rows:
                for product in rows:
                    product["Price"] = float(product["Price"])
                    product["OriginalPrice"] = None
                    product["Discount"] = None
                    product["Description"] = ""
                return rows

        except Exception as e:
            logger.warning("MySQL product fetch failed: %s", e)
            try:
                mysql_conn.close()
            except Exception:
                pass

    # SQLite fallback
    conn = sqlite3.connect(DB_SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY ProductID ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return rows




def fetch_product_by_id(product_id):
    mysql_conn = get_mysql_connection()

    if mysql_conn:
        try:
            cursor = mysql_conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    p.*,
                    c.CategoryName,
                    CASE
                        WHEN c.CategoryName = 'Tops'
                            THEN 'Tops & Shirts'
                        WHEN c.CategoryName = 'Ethnic Wear'
                            THEN 'Ethnic Wear'
                        WHEN c.CategoryName = 'Bottoms'
                            THEN 'Bottoms'
                        ELSE c.CategoryName
                    END AS Category,
                    4.7 AS Rating,
                    120 AS ReviewsCount
                FROM products p
                LEFT JOIN categories c
                    ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = %s
            """, (product_id,))

            row = cursor.fetchone()
            cursor.close()
            mysql_conn.close()

            if row:
                row["Price"] = float(row["Price"])
                return row

        except Exception as e:
            logger.warning("MySQL product lookup failed: %s", e)
            try:
                mysql_conn.close()
            except Exception:
                pass

    conn = sqlite3.connect(DB_SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM products WHERE ProductID = ?",
        (product_id,)
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None



@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "FitAI Virtual Dressing Room API",
        "version": "2.0.0",
        "endpoints": [
            "/api/products",
            "/api/products/<id>",
            "/api/try-on",
            "/api/history/<user_id>",
            "/api/orders"
        ]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})


@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    search = request.args.get("search")
    sort_by = request.args.get("sort")

    products = fetch_products_db()

    if category and category.lower() != "all":
        products = [
            p for p in products
            if category.lower() in str(p.get("Category", "")).lower()
        ]

    if search:
        s = search.lower()
        products = [
            p for p in products
            if s in str(p.get("ProductName", "")).lower()
            or s in str(p.get("Brand", "")).lower()
            or s in str(p.get("Category", "")).lower()
        ]

    if sort_by == "price_low":
        products.sort(key=lambda x: x.get("Price", 0))
    elif sort_by == "price_high":
        products.sort(key=lambda x: x.get("Price", 0), reverse=True)
    elif sort_by == "rating":
        products.sort(key=lambda x: x.get("Rating", 0), reverse=True)

    return jsonify(products)


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = fetch_product_by_id(product_id)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product)


@app.route("/api/products/image/<filename>", methods=["GET"])
def get_product_image(filename):
    safe_name = secure_filename(filename)
    return send_from_directory(PRODUCTS_DIR, safe_name)


@app.route("/api/try-on", methods=["POST"])
@login_required
def try_on():
    product_id = (
        request.form.get("productId")
        or (request.json and request.json.get("productId"))
    )

    if not product_id:
        return jsonify({"error": "Valid Product ID is required"}), 400

    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid Product ID"}), 400

    product = fetch_product_by_id(product_id)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    request_id = uuid.uuid4().hex
    input_filename = f"{request_id}_user.jpg"
    upload_path = os.path.join(
        app.config["UPLOAD_FOLDER"], input_filename
    )

    # 1. Save uploaded photo or webcam image.
    try:
        if "image" in request.files:
            image_file = request.files["image"]

            if not image_file.filename:
                return jsonify({"error": "No image selected"}), 400

            image_file.save(upload_path)

        elif request.is_json and request.json.get("image"):
            b64_str = request.json["image"]
            b64_str = re.sub(
                r"^data:image/.+;base64,", "", b64_str
            )
            image_data = base64.b64decode(b64_str, validate=True)

            with open(upload_path, "wb") as f:
                f.write(image_data)

        elif "image_base64" in request.form:
            b64_str = re.sub(
                r"^data:image/.+;base64,", "",
                request.form["image_base64"]
            )
            image_data = base64.b64decode(b64_str, validate=True)

            with open(upload_path, "wb") as f:
                f.write(image_data)

        else:
            return jsonify({
                "error": "Please provide an image via upload or webcam"
            }), 400

    except Exception as e:
        logger.exception("Could not save uploaded image")
        return jsonify({
            "error": "Invalid or unreadable input image",
            "details": str(e)
        }), 400

    # 2. Locate the selected garment image.
    product_img_name = os.path.basename(product.get("Image") or "")
    garment_path = os.path.join(PRODUCTS_DIR, product_img_name)
    logger.info("Selected product: %s", product.get("ProductName"))
    logger.info("Image filename from DB: %r", product.get("Image"))
    logger.info("Expected garment path: %s", garment_path)
    logger.info("Garment file exists: %s", os.path.isfile(garment_path))
    if not os.path.isfile(garment_path):
        return jsonify({
            "error": "Garment image not found on server",
            "expected_path": garment_path
        }), 500

    # 3. Generate the real AI try-on result using IDM-VTON.
    result_filename = f"{request_id}_result.png"
    result_path = os.path.join(
        app.config["UPLOAD_FOLDER"], result_filename
    )

    category = product.get("Category", "upper")
    garment_name = product.get("ProductName", "Garment")

    try:
        try_on_meta = run_virtual_tryon(
            human_path=upload_path,
            garment_path=garment_path,
            output_path=result_path,
            garment_name=garment_name,
            category=category,
            timeout_seconds=300
        )

        if not os.path.isfile(result_path):
            raise RuntimeError(
                "IDM-VTON did not create the expected output image."
            )

    except Exception as e:
        logger.exception("Virtual try-on generation failed")
        return jsonify({
            "error": "AI virtual try-on failed",
            "details": str(e)
        }), 502

    # 4. Save the successful result to SQLite.
    user_id = get_user()["UserID"]
    fit_score = try_on_meta.get("fitScore")
    engine = try_on_meta.get("engine", "IDM-VTON")
    try_on_id = None

    try:
        conn = sqlite3.connect(DB_SQLITE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO virtual_try_on
            (ImageInput, OverlayResult, UserID, ProductID, FitScore, Engine)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            input_filename, result_filename, user_id,
            product_id, fit_score, engine
        ))

        try_on_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO try_on_history
            (UserID, ProductID, ImageInput, OverlayResult, FitScore)
            VALUES (?, ?, ?, ?, ?)
        """, (
            user_id, product_id, input_filename,
            result_filename, fit_score
        ))

        conn.commit()
        cursor.close()
        conn.close()

    except Exception as e:
        logger.warning("Could not write try-on to SQLite: %s", e)

    # 5. Optionally save the result metadata to MySQL.
    mysql_conn = get_mysql_connection()

    if mysql_conn:
        try:
            m_cursor = mysql_conn.cursor()

            m_cursor.execute("""
                INSERT INTO virtual_try_on
                (ImageInput, OverlayResult, UserID, ProductID)
                VALUES (%s, %s, %s, %s)
            """, (
                input_filename, result_filename, user_id, product_id
            ))

            m_cursor.execute("""
                INSERT INTO try_on_history (UserID, ProductID)
                VALUES (%s, %s)
            """, (user_id, product_id))

            mysql_conn.commit()
            m_cursor.close()
            mysql_conn.close()

        except Exception as e:
            logger.warning("Could not write try-on to MySQL: %s", e)
            try:
                mysql_conn.close()
            except Exception:
                pass

    return jsonify({
        "message": "AI virtual try-on completed successfully",
        "TryOnID": try_on_id,
        "UserID": user_id,
        "ProductID": product_id,
        "product": product,
        "filename": input_filename,
        "resultFilename": result_filename,
        "originalUrl": (
            f"http://127.0.0.1:5000/api/uploads/{input_filename}"
        ),
        "resultUrl": (
            f"http://127.0.0.1:5000/api/try-on/result/{result_filename}"
        ),
        "fitScore": fit_score,
        "recommendedSize": try_on_meta.get("recommendedSize"),
        "silhouetteMatch": try_on_meta.get("silhouetteMatch"),
        "engine": engine
    }), 200


@app.route("/api/try-on/result/<filename>", methods=["GET"])
def get_try_on_result(filename):
    safe_filename = secure_filename(filename)
    return send_from_directory(app.config["UPLOAD_FOLDER"], safe_filename)


@app.route("/api/uploads/<filename>", methods=["GET"])
def get_user_upload(filename):
    safe_filename = secure_filename(filename)
    return send_from_directory(app.config["UPLOAD_FOLDER"], safe_filename)



@app.route("/api/history", methods=["GET"])
@login_required
def get_history():
    # The user ID comes from the authenticated session, never from the URL.
    user_id = get_user()["UserID"]
    conn = sqlite3.connect(DB_SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT HistoryID, TryOnDate, UserID, ProductID,
                   ImageInput, OverlayResult, FitScore
            FROM try_on_history
            WHERE UserID = ?
            ORDER BY TryOnDate DESC
        """, (user_id,))
        history = [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

    for item in history:
        product = fetch_product_by_id(item["ProductID"])
        if product:
            item["ProductName"] = product.get("ProductName", "Unknown Product")
            item["Brand"] = product.get("Brand", "")
            item["Price"] = product.get("Price", 0)
            item["Image"] = product.get("Image", "")
        if item.get("OverlayResult"):
            item["resultUrl"] = f"http://127.0.0.1:5000/api/try-on/result/{item['OverlayResult']}"
        if item.get("ImageInput"):
            item["originalUrl"] = f"http://127.0.0.1:5000/api/uploads/{item['ImageInput']}"
    return jsonify(history)


@app.route("/api/history/<int:history_id>", methods=["DELETE"])
@login_required
def delete_history_item(history_id):
    user_id = get_user()["UserID"]
    conn = sqlite3.connect(DB_SQLITE_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM try_on_history WHERE HistoryID = ? AND UserID = ?",
            (history_id, user_id)
        )
        deleted_count = cursor.rowcount
        conn.commit()
    finally:
        conn.close()
    if deleted_count == 0:
        return jsonify({"error": "Try-on history entry not found."}), 404
    return jsonify({"success": True, "message": "Try-on history entry deleted successfully."}), 200


@app.route("/api/orders", methods=["POST"])
@login_required
def create_order():
    data = request.get_json(silent=True) or {}

    items = data.get("items", [])
    shipping = data.get("shipping", {})
    total_amount = data.get("total")

    if not isinstance(items, list) or not items:
        return jsonify({
            "success": False,
            "error": "Your shopping bag is empty."
        }), 400

    if not isinstance(shipping, dict):
        return jsonify({
            "success": False,
            "error": "Invalid shipping details."
        }), 400

    required_fields = [
        "fullName", "email", "address", "city",
        "postalCode", "paymentMethod"
    ]

    if any(
        not str(shipping.get(field, "")).strip()
        for field in required_fields
    ):
        return jsonify({
            "success": False,
            "error": "Please complete all checkout fields."
        }), 400

    try:
        total_amount = float(total_amount)
        if total_amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "Invalid order total."
        }), 400

    # Keep only the product details needed for the order record.
    saved_items = []

    try:
        for item in items:
            product = item.get("product", {})
            quantity = int(item.get("quantity", 0))
            price = float(product.get("Price", 0))

            if quantity <= 0 or price < 0:
                raise ValueError

            
            saved_items.append({
    "productId": product.get("ProductID"),
    "productName": product.get("ProductName", "Product"),
    "image": product.get("Image", ""),
    "size": item.get("size", "M"),
    "quantity": quantity,
    "unitPrice": price,
    "lineTotal": round(price * quantity, 2)
})


        if not saved_items:
            raise ValueError

    except (AttributeError, TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "Invalid product details in your order."
        }), 400

    items_count = sum(item["quantity"] for item in saved_items)
    order_id = f"FITAI-{uuid.uuid4().hex[:8].upper()}"

    conn = None

    try:
        conn = sqlite3.connect(DB_SQLITE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO orders (
                UserID, TotalAmount, ItemsCount, Status,
                FullName, Email, Address, City, PostalCode,
                PaymentMethod, ItemsJSON
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            get_user()["UserID"],
            total_amount,
            items_count,
            "Confirmed",
            shipping["fullName"].strip(),
            shipping["email"].strip(),
            shipping["address"].strip(),
            shipping["city"].strip(),
            shipping["postalCode"].strip(),
            shipping["paymentMethod"],
            json.dumps(saved_items)
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "orderId": order_id,
            "message": "Order placed successfully!",
            "total": total_amount,
            "itemsCount": items_count
        }), 201

    except Exception:
        logger.exception("Could not save the complete order.")

        if conn is not None:
            conn.rollback()

        return jsonify({
            "success": False,
            "error": "We couldn't save your order. Please try again."
        }), 500

    finally:
        if conn is not None:
            conn.close()


@app.route("/api/orders", methods=["GET"])
@login_required
def get_orders():
    user_id = get_user()["UserID"]

    conn = None

    try:
        conn = sqlite3.connect(DB_SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                OrderID,
                TotalAmount,
                ItemsCount,
                Status,
                OrderDate,
                FullName,
                Email,
                Address,
                City,
                PostalCode,
                PaymentMethod,
                ItemsJSON
            FROM orders
            WHERE UserID = ?
            ORDER BY OrderDate DESC, OrderID DESC
        """, (user_id,))

        orders = []

        for row in cursor.fetchall():
            order = dict(row)

            # Decode the saved product details.
            try:
                order["Items"] = json.loads(
                    order.get("ItemsJSON") or "[]"
                )
            except (TypeError, json.JSONDecodeError):
                order["Items"] = []

            # Remove the storage-only field from the response.
            order.pop("ItemsJSON", None)
            orders.append(order)

        return jsonify(orders), 200

    except Exception:
        logger.exception("Could not retrieve orders.")
        return jsonify({
            "error": "Unable to retrieve orders right now."
        }), 500

    finally:
        if conn is not None:
            conn.close()



if __name__ == "__main__":
    app.run(debug=True, port=5000)
