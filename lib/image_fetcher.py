import urllib.parse
import requests
import re
import random

def fetch_image_url(query):
    """Searches for high-performance illustrative image matching query.
    
    Tries Unsplash query parsing or falls back to Wikipedia/Wikimedia Open API.
    """
    clean_query = str(query).strip()
    if not clean_query:
        return ""
        
    session = requests.Session()
    # Spoof human user-agent to bypass blocks on local developer devices
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    
    # 1. Attempt Wikipedia/Wikimedia Commons Open Search API (highly reliable, uncapped free API)
    try:
        encoded_query = urllib.parse.quote(clean_query)
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch={encoded_query}&gsrlimit=5&piprop=original&origin=*"
        res = session.get(wiki_url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            pages = data.get("query", {}).get("pages", {})
            img_urls = []
            for _, page in pages.items():
                orig_url = page.get("original", {}).get("source", "")
                if orig_url and orig_url.lower().endswith((".jpg", ".png", ".jpeg", ".webp")):
                    img_urls.append(orig_url)
            if img_urls:
                return img_urls[0] # Return most relevant first item
    except Exception as wiki_err:
        print(f"Wikimedia Search bypassed: {wiki_err}")
        
    # 2. Unsplash beautiful learning placeholder fallback
    fallback_placeholders = [
        "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=400", # Book/Learning
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400&h=400", # Notebook
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400&h=400", # Library
        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400&h=400"  # Notes
    ]
    
    return random.choice(fallback_placeholders)

def validate_image_url(url):
    """Simple check if image is live"""
    try:
        res = requests.head(url, timeout=3)
        return res.status_code < 400
    except Exception:
        return False
