import os
import requests
import urllib.parse

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "audio_cache")

def safe_filename(word):
    """Normalize word to be compatible with filesystem filenames."""
    import re
    # Remove chars not friendly to folder paths
    cleaned = re.sub(r'[\\/*?:"<>|]', "", word)
    return cleaned.strip() or "word"

def get_audio_paths(level, day, row_idx, word):
    """Generates paths for pronounce, slow, and spell caching folders."""
    safe_word = safe_filename(word)
    # Ensure nested folders exist
    level_dir = os.path.join(CACHE_DIR, safe_filename(level), safe_filename(day))
    
    paths = {}
    for mode in ["pronounce", "slow", "spell"]:
        mode_dir = os.path.join(level_dir, mode)
        os.makedirs(mode_dir, exist_ok=True)
        paths[mode] = os.path.join(mode_dir, f"{row_idx}_{safe_word}.mp3")
        
    return paths

def download_tts(text, file_path, speed_rate=1.0):
    """Downloads premium quality neural vocal audio from google's official stream block."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # Google Translate TTS endpoint supporting dynamic speed adjustments (ttsspeed parameter)
    encoded_text = urllib.parse.quote(text)
    # ttsspeed parameter works brilliantly to adjust voice rate
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=de&client=tw-ob&q={encoded_text}"
    if speed_rate < 0.8:
        url += "&ttsspeed=0.24" # slower speed
        
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(res.content)
            return True
    except Exception as e:
        print(f"Failed to generate custom TTS for spelling/speech: {e}")
    return False

def pronounce_word(word, level, day, row_idx):
    paths = get_audio_paths(level, day, row_idx, word)
    dest = paths["pronounce"]
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        download_tts(word, dest, speed_rate=1.0)
    return dest

def slow_word(word, level, day, row_idx):
    paths = get_audio_paths(level, day, row_idx, word)
    dest = paths["slow"]
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        download_tts(word, dest, speed_rate=0.6)
    return dest

def spell_word(word, level, day, row_idx):
    paths = get_audio_paths(level, day, row_idx, word)
    dest = paths["spell"]
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        # Separate letters so Google spells it out clearly with tiny spaces
        spelled = "   ".join(list(word))
        download_tts(spelled, dest, speed_rate=0.8)
    return dest
