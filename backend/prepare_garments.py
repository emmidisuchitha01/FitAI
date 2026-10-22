import os
from PIL import Image, ImageFilter

ARTIFACTS_DIR = r"C:\Users\emmid\.gemini\antigravity\brain\adc341f1-c2e1-45e8-9db9-442e09e7a847"
PRODUCTS_DIR = r"C:\Users\emmid\Downloads\FitAI\frontend\src\assets\Products"

GARMENTS = [
    {
        "name": "kurti",
        "src_prefix": "kurti_garment",
        "target_jpg": "kurti.jpg",
        "target_png": "kurti.png"
    },
    {
        "name": "oversized-shirt",
        "src_prefix": "oversized_shirt",
        "target_jpg": "oversized-shirt.jpg",
        "target_png": "oversized-shirt.png"
    },
    {
        "name": "white-top",
        "src_prefix": "white_top",
        "target_jpg": "white-top.jpg",
        "target_png": "white-top.png"
    },
    {
        "name": "black-jeans",
        "src_prefix": "black_jeans",
        "target_jpg": "black-jeans.jpg",
        "target_png": "black-jeans.png"
    }
]

def make_clean_transparent_garment(img):
    import cv2
    import numpy as np

    # Convert PIL Image to RGB OpenCV array
    rgb = np.array(img.convert("RGB"))
    
    # Background in our studio flat lays is pure clean white (R>=246, G>=246, B>=246)
    is_bg = (rgb[:, :, 0] >= 246) & (rgb[:, :, 1] >= 246) & (rgb[:, :, 2] >= 246)
    
    # Create initial alpha mask
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    
    # Erode alpha slightly (3px) to remove any anti-aliased white fringe at the boundary
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha_eroded = cv2.erode(alpha, kernel, iterations=1)
    
    # Soften outer edge slightly with 1px gaussian blur for realistic blending
    alpha_soft = cv2.GaussianBlur(alpha_eroded, (3, 3), 0.8)
    
    # Assemble RGBA image
    rgba = cv2.cvtColor(rgb, cv2.COLOR_RGB2RGBA)
    rgba[:, :, 3] = alpha_soft
    
    result = Image.fromarray(rgba)
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    return result

def run():
    all_files = os.listdir(ARTIFACTS_DIR)
    for g in GARMENTS:
        matches = [f for f in all_files if f.startswith(g["src_prefix"]) and f.endswith(".png")]
        if not matches:
            continue
        latest_file = sorted(matches)[-1]
        src_path = os.path.join(ARTIFACTS_DIR, latest_file)
        orig_img = Image.open(src_path)

        # Save clean transparent PNG
        clean_png = make_clean_transparent_garment(orig_img)
        target_png = os.path.join(PRODUCTS_DIR, g["target_png"])
        clean_png.save(target_png, "PNG")
        print(f"Saved pristine {g['target_png']} without white fringe (size: {clean_png.size})")

if __name__ == "__main__":
    run()
