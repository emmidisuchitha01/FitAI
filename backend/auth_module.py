import os, re, sqlite3, logging
from functools import wraps
from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)
DB = os.path.join(os.path.dirname(__file__), "fitai.db")

def connect():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_auth_tables():
    c = connect()
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        FullName TEXT NOT NULL,
        Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        PasswordHash TEXT NOT NULL,
        Role TEXT NOT NULL DEFAULT 'user',
        IsActive INTEGER NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.commit()
    email = os.getenv("FITAI_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("FITAI_ADMIN_PASSWORD", "")
    if email and password:
        exists = c.execute("SELECT UserID FROM users WHERE Email=?", (email,)).fetchone()
        if not exists:
            c.execute("INSERT INTO users (FullName,Email,PasswordHash,Role) VALUES (?,?,?,'admin')",
                      ("FitAI Administrator", email, generate_password_hash(password)))
            c.commit()
    c.close()

def get_user():
    uid = session.get("user_id")
    if not uid: return None
    c = connect()
    u = c.execute("SELECT UserID,FullName,Email,Role,IsActive FROM users WHERE UserID=?", (uid,)).fetchone()
    c.close()
    if not u or not u["IsActive"]:
        session.clear()
        return None
    return dict(u)

def login_required(fn):
    @wraps(fn)
    def wrapped(*a, **kw):
        if not get_user(): return jsonify({"error":"Please log in first."}), 401
        return fn(*a, **kw)
    return wrapped

def admin_required(fn):
    @wraps(fn)
    def wrapped(*a, **kw):
        u=get_user()
        if not u: return jsonify({"error":"Please log in first."}), 401
        if u["Role"]!="admin": return jsonify({"error":"Administrator access required."}), 403
        return fn(*a, **kw)
    return wrapped

def safe_user(u):
    return {"UserID":u["UserID"],"FullName":u["FullName"],"Email":u["Email"],"Role":u["Role"]}

@auth_bp.post("/api/auth/register")
def register():
    d=request.get_json(silent=True) or {}
    name=str(d.get("fullName","")).strip()
    email=str(d.get("email","")).strip().lower()
    password=str(d.get("password",""))
    if len(name)<2: return jsonify({"error":"Enter your full name."}),400
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",email): return jsonify({"error":"Enter a valid email."}),400
    if len(password)<8: return jsonify({"error":"Password must be at least 8 characters."}),400
    c=connect()
    try:
        cur=c.execute("INSERT INTO users (FullName,Email,PasswordHash,Role) VALUES (?,?,?,'user')",
                      (name,email,generate_password_hash(password)))
        c.commit()
        u=c.execute("SELECT UserID,FullName,Email,Role FROM users WHERE UserID=?",(cur.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        c.close(); return jsonify({"error":"An account with this email already exists."}),409
    c.close(); session.clear(); session["user_id"]=u["UserID"]
    return jsonify({"success":True,"user":safe_user(u)}),201

@auth_bp.post("/api/auth/login")
def login():
    d=request.get_json(silent=True) or {}
    email=str(d.get("email","")).strip().lower()
    c=connect(); u=c.execute("SELECT * FROM users WHERE Email=?",(email,)).fetchone(); c.close()
    if not u or not u["IsActive"] or not check_password_hash(u["PasswordHash"],str(d.get("password",""))):
        return jsonify({"error":"Invalid email or password."}),401
    session.clear(); session["user_id"]=u["UserID"]; session.permanent=True
    return jsonify({"success":True,"user":safe_user(u)})

@auth_bp.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"success":True})

@auth_bp.get("/api/auth/me")
def me():
    return jsonify({"user":get_user()})

@auth_bp.get("/api/admin/users")
@admin_required
def list_users():
    c=connect(); rows=c.execute("SELECT UserID,FullName,Email,Role,IsActive,CreatedAt FROM users ORDER BY UserID DESC").fetchall(); c.close()
    return jsonify([dict(x) for x in rows])

@auth_bp.patch("/api/admin/users/<int:uid>")
@admin_required
def update_user(uid):
    d=request.get_json(silent=True) or {}; sets=[]; vals=[]
    if "role" in d:
        if d["role"] not in ("user","admin"): return jsonify({"error":"Invalid role."}),400
        if get_user()["UserID"]==uid and d["role"]!="admin": return jsonify({"error":"Cannot remove your own admin role."}),400
        sets.append("Role=?"); vals.append(d["role"])
    if "isActive" in d:
        if get_user()["UserID"]==uid and not d["isActive"]: return jsonify({"error":"Cannot disable your own account."}),400
        sets.append("IsActive=?"); vals.append(1 if d["isActive"] else 0)
    if not sets: return jsonify({"error":"No changes supplied."}),400
    vals.append(uid); c=connect(); cur=c.execute("UPDATE users SET "+",".join(sets)+" WHERE UserID=?",vals); c.commit(); c.close()
    if not cur.rowcount: return jsonify({"error":"User not found."}),404
    return jsonify({"success":True})

@auth_bp.delete("/api/admin/users/<int:uid>")
@admin_required
def delete_user(uid):
    if get_user()["UserID"]==uid: return jsonify({"error":"Cannot delete your own account."}),400
    c=connect(); cur=c.execute("DELETE FROM users WHERE UserID=?",(uid,)); c.commit(); c.close()
    if not cur.rowcount: return jsonify({"error":"User not found."}),404
    return jsonify({"success":True})

def _mysql_connection():
    """Connect to the same MySQL catalogue used by app.py, if configured."""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "fitai_db"),
            port=int(os.getenv("DB_PORT", 3306)),
            connection_timeout=2,
        )
    except Exception as exc:
        logger.info("MySQL catalogue unavailable; admin products use SQLite fallback: %s", exc)
        return None


def _category_id(cursor, category_name):
    """Resolve the category label displayed by /api/products to CategoryID."""
    name = str(category_name or "").strip()
    if not name:
        return None
    cursor.execute("SELECT CategoryID, CategoryName FROM categories")
    rows = cursor.fetchall()
    normalized = name.casefold()
    aliases = {
        "tops & shirts": {"tops", "tops & shirts", "shirts"},
        "bottoms": {"bottoms", "jeans & bottoms"},
        "ethnic wear": {"ethnic wear", "kurtis & ethnic", "kurtis", "ethnic"},
    }
    accepted = aliases.get(normalized, {normalized})
    for row in rows:
        cid, label = row[0], str(row[1] or "").strip()
        if label.casefold() in accepted or label.casefold() == normalized:
            return cid
    return None


@auth_bp.post("/api/admin/products")
@admin_required
def add_product():
    d = request.get_json(silent=True) or {}
    for key in ("ProductName", "Price", "Image", "Category"):
        if not str(d.get(key, "")).strip():
            return jsonify({"error": f"{key} is required."}), 400
    try:
        price = float(d["Price"])
        if price < 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid price."}), 400

    mysql_conn = _mysql_connection()
    if mysql_conn:
        try:
            cursor = mysql_conn.cursor()
            category_id = _category_id(cursor, d.get("Category"))
            if category_id is None:
                return jsonify({"error": "Choose an existing product category from the catalogue."}), 400
            # These are the catalogue columns confirmed by app.py. Do not write a
            # separate SQLite product that the public catalogue will never show.
            cursor.execute("""INSERT INTO products
                (ProductName, Brand, Price, Image, Size, CategoryID)
                VALUES (%s, %s, %s, %s, %s, %s)""",
                (str(d["ProductName"]).strip(), str(d.get("Brand", "")).strip(),
                 price, str(d["Image"]).strip(), str(d.get("Size", "S, M, L, XL")).strip(), category_id))
            product_id = cursor.lastrowid
            mysql_conn.commit()
            cursor.close()
            return jsonify({"success": True, "ProductID": product_id}), 201
        except Exception:
            logger.exception("MySQL product creation failed")
            mysql_conn.rollback()
            return jsonify({"error": "Could not add product to the active catalogue. Check the MySQL products schema and required columns."}), 500
        finally:
            mysql_conn.close()

    # MySQL unavailable: retain the existing SQLite fallback catalogue.
    c = connect()
    cur = c.execute("""INSERT INTO products
        (ProductName,Brand,Price,OriginalPrice,Discount,Image,Category,Size,Rating,ReviewsCount,Description,InStock,Fabric,Color)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (str(d["ProductName"]).strip(), str(d.get("Brand", "")).strip(), price,
         d.get("OriginalPrice", price), d.get("Discount", ""), str(d["Image"]).strip(),
         str(d["Category"]).strip(), d.get("Size", "S, M, L, XL"), d.get("Rating", 0),
         d.get("ReviewsCount", 0), d.get("Description", ""), 1 if d.get("InStock", True) else 0,
         d.get("Fabric", ""), d.get("Color", "")))
    c.commit(); product_id = cur.lastrowid; c.close()
    return jsonify({"success": True, "ProductID": product_id}), 201


@auth_bp.put("/api/admin/products/<int:pid>")
@admin_required
def edit_product(pid):
    d = request.get_json(silent=True) or {}
    mysql_conn = _mysql_connection()
    if mysql_conn:
        try:
            cursor = mysql_conn.cursor()
            # Update the same MySQL row read by GET /api/products.
            fields = []
            values = []
            for key, column in (("ProductName", "ProductName"), ("Brand", "Brand"),
                                ("Price", "Price"), ("Image", "Image"), ("Size", "Size")):
                if key in d:
                    value = d[key]
                    if key == "Price":
                        try:
                            value = float(value)
                            if value < 0: raise ValueError
                        except (TypeError, ValueError):
                            return jsonify({"error": "Invalid price."}), 400
                    fields.append(f"{column}=%s")
                    values.append(value)
            if "Category" in d:
                category_id = _category_id(cursor, d.get("Category"))
                if category_id is None:
                    return jsonify({"error": "Choose an existing product category from the catalogue."}), 400
                fields.append("CategoryID=%s")
                values.append(category_id)
            if not fields:
                return jsonify({"error": "No editable product fields supplied."}), 400
            values.append(pid)
            cursor.execute(f"UPDATE products SET {', '.join(fields)} WHERE ProductID=%s", tuple(values))
            if cursor.rowcount == 0:
                # MySQL reports 0 when the submitted values equal existing values;
                # check existence before treating it as missing.
                cursor.execute("SELECT ProductID FROM products WHERE ProductID=%s", (pid,))
                exists = cursor.fetchone()
                if not exists:
                    return jsonify({"error": "Product not found."}), 404
            mysql_conn.commit()
            cursor.close()
            return jsonify({"success": True, "ProductID": pid, "message": "Product updated in the catalogue."})
        except Exception:
            logger.exception("MySQL product update failed")
            mysql_conn.rollback()
            return jsonify({"error": "Could not update the active catalogue. Check the MySQL products schema."}), 500
        finally:
            mysql_conn.close()

    allowed = ("ProductName", "Brand", "Price", "OriginalPrice", "Discount", "Image", "Category", "Size", "Rating", "ReviewsCount", "Description", "InStock", "Fabric", "Color")
    sets, vals = [], []
    for key in allowed:
        if key in d:
            value = d[key]
            if key == "Price":
                try:
                    value = float(value)
                    if value < 0: raise ValueError
                except (TypeError, ValueError):
                    return jsonify({"error": "Invalid price."}), 400
            if key == "InStock": value = 1 if value else 0
            sets.append(key + "=?"); vals.append(value)
    if not sets: return jsonify({"error": "No fields supplied."}), 400
    vals.append(pid); c = connect(); cur = c.execute("UPDATE products SET " + ",".join(sets) + " WHERE ProductID=?", vals); c.commit(); changed = cur.rowcount; c.close()
    if not changed: return jsonify({"error": "Product not found."}), 404
    return jsonify({"success": True, "ProductID": pid})


@auth_bp.delete("/api/admin/products/<int:pid>")
@admin_required
def delete_product(pid):
    mysql_conn = _mysql_connection()
    if mysql_conn:
        try:
            cursor = mysql_conn.cursor()
            cursor.execute("DELETE FROM products WHERE ProductID=%s", (pid,))
            if cursor.rowcount == 0:
                return jsonify({"error": "Product not found."}), 404
            mysql_conn.commit()
            cursor.close()
            return jsonify({"success": True, "ProductID": pid})
        except Exception:
            logger.exception("MySQL product deletion failed")
            mysql_conn.rollback()
            return jsonify({"error": "Could not delete the product. It may be referenced by another table."}), 500
        finally:
            mysql_conn.close()
    c = connect(); cur = c.execute("DELETE FROM products WHERE ProductID=?", (pid,)); c.commit(); changed = cur.rowcount; c.close()
    if not changed: return jsonify({"error": "Product not found."}), 404
    return jsonify({"success": True})
