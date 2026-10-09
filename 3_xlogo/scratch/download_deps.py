import os
import re
import urllib.request

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def download_file(url, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
            with open(filepath, 'wb') as f:
                f.write(content)
            print(f"Downloaded: {url} -> {filepath} ({len(content)} bytes)")
            return content
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return None

def process_google_fonts():
    print("\n--- Processing Google Fonts ---")
    gfonts_url = "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap"
    css_content = download_file(gfonts_url, "scratch/gfonts_temp.css")
    if not css_content:
        return
    
    css_text = css_content.decode('utf-8')
    url_pattern = r'url\((https://fonts\.gstatic\.com/[^)]+)\)'
    matches = re.findall(url_pattern, css_text)
    
    fonts_dir = "css/fonts"
    os.makedirs(fonts_dir, exist_ok=True)
    
    replacements = {}
    for idx, font_url in enumerate(matches):
        filename = os.path.basename(font_url.split('?')[0])
        local_path = os.path.join(fonts_dir, filename).replace('\\', '/')
        if font_url not in replacements:
            download_file(font_url, local_path)
            replacements[font_url] = f"fonts/{filename}"
    
    for font_url, local_rel_path in replacements.items():
        css_text = css_text.replace(font_url, local_rel_path)
        
    with open("css/fonts.css", "w", encoding="utf-8") as f:
        f.write(css_text)
    print("Saved css/fonts.css successfully!")

def process_fontawesome():
    print("\n--- Processing FontAwesome ---")
    fa_css_url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    css_content = download_file(fa_css_url, "css/all.min.css")
    if not css_content:
        return

    css_text = css_content.decode('utf-8')
    # Find relative font files in all.min.css like ../webfonts/fa-solid-900.woff2
    font_files = set(re.findall(r'webfonts/([a-zA-Z0-9\.-]+\.(?:woff2|woff|ttf|eot|svg))', css_text))
    base_webfont_url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/"
    
    webfonts_dir = "css/webfonts"
    os.makedirs(webfonts_dir, exist_ok=True)
    
    for ff in font_files:
        download_file(base_webfont_url + ff, os.path.join(webfonts_dir, ff))
    print("FontAwesome files downloaded successfully!")

def process_blockly_media():
    print("\n--- Processing Blockly Media ---")
    media_files = [
        "sprites.svg",
        "1x1.gif",
        "click.mp3",
        "click.wav",
        "click.ogg",
        "delete.mp3",
        "delete.wav",
        "delete.ogg",
        "disconnect.mp3",
        "disconnect.wav",
        "disconnect.ogg",
        "handopen.cur",
        "handclosed.cur",
        "handpeg.cur"
    ]
    base_media_url = "https://unpkg.com/blockly/media/"
    media_dir = "js/media"
    os.makedirs(media_dir, exist_ok=True)
    for mf in media_files:
        download_file(base_media_url + mf, os.path.join(media_dir, mf))

if __name__ == "__main__":
    process_google_fonts()
    process_fontawesome()
    process_blockly_media()
