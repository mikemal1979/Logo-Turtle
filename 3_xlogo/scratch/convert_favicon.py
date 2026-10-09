from PIL import Image, ImageDraw
import os

img_path = r"C:\Users\Acer\.gemini\antigravity-ide\brain\2cca0216-148d-4317-ab64-157e117e308e\turtle_favicon_1790434939599.jpg"
target_ico = r"f:\Downloads\Python\Digipuzzle\descargador_universal\xlogo\favicon.ico"
target_png = r"f:\Downloads\Python\Digipuzzle\descargador_universal\xlogo\favicon.png"

if os.path.exists(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    
    # The generated image has a central rounded square app icon.
    # Crop slightly inside the app icon container or use full image centered
    crop_margin = int(w * 0.15)
    img_cropped = img.crop((crop_margin, crop_margin, w - crop_margin, h - crop_margin))
    
    # Save ICO with multi-sizes
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img_cropped.save(target_ico, format="ICO", sizes=sizes)
    
    # Save PNG version
    img_cropped.resize((256, 256), Image.Resampling.LANCZOS).save(target_png, format="PNG")
    print("Favicon successfully generated at:", target_ico)
else:
    print("Source image not found:", img_path)
