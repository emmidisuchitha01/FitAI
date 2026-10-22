import os
import time
from tryon_service import fast_accurate_tryon

user_img = os.path.join("uploads", "4663608b183c424780ea73ec64de8e1c_WhatsApp_Image_2026-10-11_at_4.48.49_PM.jpeg")
garments = [
    ("kurti.png", "kurti", "test_user_kurti.png"),
    ("oversized-shirt.png", "upper", "test_user_shirt.png"),
    ("white-top.png", "upper", "test_user_whitetop.png"),
    ("black-jeans.png", "bottom", "test_user_jeans.png"),
]

for g_file, cat, out_name in garments:
    g_path = os.path.join("..", "frontend", "src", "assets", "Products", g_file)
    out_path = os.path.join("uploads", out_name)
    t0 = time.time()
    res = fast_accurate_tryon(user_img, g_path, out_path, category=cat)
    dt = round(time.time() - t0, 3)
    size = os.path.getsize(out_path) if os.path.isfile(out_path) else 0
    print(f"Try-On for {g_file}: Success={res}, Time={dt}s, Size={size} bytes")
