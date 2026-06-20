import random
import os
import time
import base64
import re
import streamlit as st
import pandas as pd

from lib.excel_manager import get_available_levels, load_level_data
from lib.image_fetcher import fetch_image_url
from lib.tts_service import pronounce_word, slow_word, spell_word, get_audio_paths

# ── Page Configuration ──
st.set_page_config(
    page_title="German Vocab Coach 🇩🇪",
    page_icon="🇩🇪",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ── Premium Custom CSS & Theme Engineering ──
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

html, body, [class*="css"], [data-testid="stAppViewContainer"] {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #f8fafc;
}

/* Background layout styling matching the twilight React canvas with dynamic radial glow */
.stApp {
    background-color: #09090b !important;
    background-image: radial-gradient(circle at top, rgba(79, 70, 229, 0.1) 0%, rgba(9, 9, 11, 0) 70%) !important;
    background-attachment: fixed !important;
}

/* Invisible standard headers & footers to enforce elegant presentation flow */
#MainMenu, footer, header { visibility: hidden; }
div[data-testid="stToolbar"] { display: none; }

/* Constrain content density for optimal vertical rhythm */
.block-container {
    max-width: 600px !important;
    padding: 1.5rem 1.25rem !important;
}

/* Scraping & copying prevention styles: full lock down */
body, html, [data-testid="stAppViewContainer"], [data-testid="stMarkdownContainer"], .glass-card, .german-word, .phonetic, .note-text, img, button {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    -webkit-user-drag: none !important;
}

/* Glassmorphism primary container */
.glass-card {
    background: rgba(13, 17, 28, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 2.25rem;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 25px 60px 0 rgba(0, 0, 0, 0.45);
    margin-bottom: 1.25rem;
    animation: fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Styled bento grids / day list panels */
.day-card {
    background: rgba(22, 28, 45, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 18px;
    padding: 1.25rem 1.5rem;
    margin: 0.65rem 0;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.day-card:hover {
    border-color: rgba(99, 102, 241, 0.35);
    background: rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.12);
}

/* Gender tags & speech labels matching React CEFR styles */
.badge {
    display: inline-block;
    font-size: 0.725rem;
    font-weight: 750;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
}
.badge-der { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25); }
.badge-die { background: rgba(236, 72, 153, 0.12); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.25); }
.badge-das { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }
.badge-verb { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
.badge-adjective { background: rgba(139, 92, 246, 0.12); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.25); }
.badge-preposition { background: rgba(6, 182, 212, 0.12); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.25); }
.badge-default { background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); }

/* Typography */
.german-word {
    font-size: 2.85rem;
    font-weight: 800;
    color: #ffffff;
    text-align: center;
    margin: 0.5rem 0;
    letter-spacing: -0.03em;
    word-break: break-word;
}
.phonetic {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    color: #a5b4fc;
    background: rgba(99, 102, 241, 0.08);
    padding: 0.35rem 0.95rem;
    border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.15);
    display: inline-block;
    font-weight: 550;
    letter-spacing: 0.05em;
}
.note-text {
    font-size: 0.775rem;
    color: #94a3b8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

/* MCQ option button grid and custom inputs */
.opt-btn, .stButton > button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    background: rgba(9, 9, 11, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 14px !important;
    padding: 0.85rem 1.25rem !important;
    color: #cbd5e1 !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    min-height: 52px !important;
    width: 100% !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    box-sizing: border-box !important;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3) !important;
    margin-bottom: 0.5rem;
}
.opt-btn:hover, .stButton > button:hover {
    background: rgba(99, 102, 241, 0.08) !important;
    border-color: rgba(99, 102, 241, 0.35) !important;
    color: #ffffff !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.25) !important;
}

/* Correct MCQ status color values */
.opt-correct {
    background: rgba(16, 185, 129, 0.12) !important;
    border-color: rgba(16, 185, 129, 0.4) !important;
    color: #34d399 !important;
    font-weight: 700 !important;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.15) !important;
}
/* Incorrect MCQ status color values */
.opt-wrong {
    background: rgba(239, 68, 68, 0.12) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: #f87171 !important;
    font-weight: 700 !important;
}

/* Feedback blocks resembling React App Alerts */
.fb-correct {
    background: rgba(16, 185, 129, 0.04);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    color: #34d399;
    margin-top: 1.2rem;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fb-wrong {
    background: rgba(239, 68, 68, 0.04);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    color: #f87171;
    margin-top: 1.2rem;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Streak value wrapper */
.streak-box {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 999px;
    padding: 0.35rem 0.95rem;
    font-size: 0.825rem;
    font-weight: 700;
    color: #fbbf24;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

/* Progress bar linear track override */
.stProgress > div > div {
    background: linear-gradient(90deg, #4f46e5, #6366f1, #22d3ee) !important;
    border-radius: 999px;
    height: 8px !important;
}

/* Statistic metrics card elements */
.stat-card {
    background: rgba(20, 26, 42, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    padding: 1.25rem;
    text-align: center;
}
.stat-label {
    font-size: 0.725rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}
.stat-value {
    font-size: 1.65rem;
    font-weight: 800;
    margin-top: 0.25rem;
}

/* Primary/Next selection button override */
div[data-testid="stBaseButton-primary"] > button {
    background: linear-gradient(90deg, #4f46e5, #6366f1) !important;
    border: none !important;
    color: #ffffff !important;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35) !important;
    font-weight: 750 !important;
}
div[data-testid="stBaseButton-primary"] > button:hover {
    background: linear-gradient(90deg, #4338ca, #4f46e5) !important;
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5) !important;
}

/* Responsive custom spacing of images */
div[data-testid="stImage"] > img {
    max-width: 150px !important;
    max-height: 150px !important;
    width: auto !important;
    height: auto !important;
    border-radius: 18px !important;
    margin: 0.75rem auto !important;
    display: block !important;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Invisible default audio elements */
div[data-testid="stAudio"] {
    display: none !important;
    height: 0px !important;
    width: 0px !important;
    padding: 0px !important;
}

/* Expanded accordion panels override to look clean & inline in dark mode */
.stExpander {
    background: rgba(9, 9, 11, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 12px !important;
    margin-top: 0.5rem !important;
    color: #cbd5e1 !important;
}

/* Animations */
@keyframes fadeIn { from {opacity: 0; transform: translateY(8px)} to {opacity: 1; transform: translateY(0)} }
@keyframes slideUp { from {opacity: 0; transform: translateY(12px)} to {opacity: 1; transform: translateY(0)} }

/* Small screen adjustments */
@media (max-width: 768px) {
    .block-container { padding: 1rem 0.5rem !important; }
    .glass-card { padding: 1.4rem; border-radius: 20px; }
    .german-word { font-size: 2.15rem; }
    .day-card { padding: 1rem 1.15rem; }
    .stat-card { padding: 0.85rem; }
    .stat-value { font-size: 1.35rem; }
}
</style>
""", unsafe_allow_html=True)

# ── Session State Setup ──
DEFAULTS = {
    "screen": "home",  # "home" | "quiz" | "browse" | "summary"
    "level": None,
    "day": None,
    "deck": [],
    "idx": 0,
    "score": 0,
    "attempts": 0,
    "streak": 0,
    "max_streak": 0,
    "answered": False,
    "selected": None,
    "show_image": False,
    "card_images": {},
    "audio_trigger": None
}

for k, v in DEFAULTS.items():
    if k not in st.session_state:
        st.session_state[k] = v

def format_example_sentence(sentence, word):
    """Splits sentence case-insensitively using currentWord's German representation."""
    if not sentence or not word:
        return sentence or ""
    try:
        escaped_word = re.escape(word)
        regex = re.compile(rf"({escaped_word})", re.IGNORECASE)
        # Highlight match with emerald styling resembling React emerald-400
        def replace_match(match):
            m = match.group(1)
            return f'<span style="color: #34d399; font-weight: 800; text-decoration: underline; text-underline-offset: 4px;">{m}</span>'
        return regex.sub(replace_match, sentence)
    except Exception:
        return sentence

def render_badge(gender, is_verb, is_adj, is_prep):
    """Outputs matching CEFR visual badge based on row attributes."""
    if is_prep:
         return '<span class="badge badge-preposition">Preposition</span>'
    if is_adj:
         return '<span class="badge badge-adjective">Adjective</span>'
    if is_verb:
         return '<span class="badge badge-verb">Verb</span>'
         
    g = str(gender).strip().lower()
    if g in ["masculine", "der"]:
        return '<span class="badge badge-der">der</span>'
    elif g in ["feminine", "die"]:
        return '<span class="badge badge-die font-bold">die</span>'
    elif g in ["neuter", "das"]:
        return '<span class="badge badge-das">das</span>'
        
    return '<span class="badge badge-default">Vocab</span>'

def embed_play_sound(path):
    """Generates immediate hidden audio base 64 stream playback without frame delay."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        try:
            with open(path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode()
            st.markdown(f'<audio autoplay src="data:audio/mp3;base64,{encoded}"></audio>', unsafe_allow_html=True)
        except Exception:
            pass

# ══════════════════════════════════════
# REPEATED NAVIGATION PANEL SUBHEADER
# ══════════════════════════════════════
def render_navigation_header():
    """Renders premium dual segmented controls to instantly pick quiz vs browser."""
    current_screen = st.session_state.screen
    deck_size = len(st.session_state.deck)
    
    col_back, col_spacer, col_view_toggle = st.columns([1, 0.1, 2.5])
    
    with col_back:
        if st.button("← Back", key="top_global_back_btn"):
            st.session_state.screen = "home"
            st.session_state.level = None
            st.session_state.day = None
            st.session_state.deck = []
            st.rerun()
            
    with col_view_toggle:
        col_quiz_btn, col_browse_btn = st.columns(2)
        with col_quiz_btn:
            quiz_type = "primary" if current_screen == "quiz" else "secondary"
            if st.button("🎓 Play Quiz", key="toggle_to_quiz_view", type=quiz_type, use_container_width=True):
                st.session_state.screen = "quiz"
                st.rerun()
        with col_browse_btn:
            browse_type = "primary" if current_screen == "browse" else "secondary"
            if st.button(f"📖 Browse Words ({deck_size})", key="toggle_to_browse_view", type=browse_type, use_container_width=True):
                st.session_state.screen = "browse"
                st.rerun()

# ══════════════════════════════════════
# UNIVERSAL HEADER BLOCK
# ══════════════════════════════════════
def render_brand_header():
    """Universal high fidelity banner on all screens."""
    st.markdown("""
    <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="font-size: 2.2rem; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 0.4rem 0.6rem; display: inline-flex; align-items: center; justify-content: center;">🇩🇪</div>
            <div>
                <h1 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.2;">
                    Vocab Project 
                    <span style="font-size: 0.55rem; background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.3); vertical-align: middle; margin-left: 0.4rem; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">GERMAN COACH</span>
                </h1>
                <p style="font-size: 0.7rem; color: #64748b; margin: 0; margin-top: 0.1rem;">Minimal dark vocab cards with smart speech & visual association cue triggers</p>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(9, 9, 11, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.4rem 0.8rem; border-radius: 12px;">
            <span style="color: #fbbf24; font-size: 1rem;">🔥</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 800; color: #818cf8;">""" + str(st.session_state.max_streak) + """ Max</span>
        </div>
    </div>
    """, unsafe_allow_html=True)


# ══════════════════════════════════════
# SCREEN: HOME (Dashboard Selection)
# ══════════════════════════════════════
def render_home():
    render_brand_header()
    
    levels = get_available_levels()
    if not levels:
        st.markdown("""
        <div class="glass-card" style="text-align:center; border-color: rgba(239, 68, 68, 0.25)">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem">📂</div>
            <div style="font-weight: 700; font-size: 1.2rem; color: #f87171">No Vocabulary Folder Loaded</div>
            <div style="font-size: 0.95rem; color: #94a3b8; margin-top: 0.4rem">
                Please place any of your Excel files named like <code>A1_vocab.xlsx</code> or <code>B2_vocab.xlsx</code> inside the <code>vocab_files/</code> folder to scan them dynamically.
            </div>
        </div>
        """, unsafe_allow_html=True)
        return

    # Compact Selector exactly mapping React Choose Level Set dropdown
    selected_level = st.selectbox(
        "Choose Level Set",
        levels,
        help="Levels parsed dynamically from your vocab_files directory."
    )

    days_data = load_level_data(selected_level)
    if not days_data:
        st.markdown(f"""
        <div class="glass-card" style="text-align:center; border-color: #fbbf24">
            <div style="font-size: 2.0rem; margin-bottom: 0.5rem">⚠️</div>
            <div style="font-weight: 700; color: #fbbf24">No sheets found inside index {selected_level}</div>
            <div style="font-size: 0.9rem; color: #94a3b8; margin-top: 0.35rem">Verify that your excel file contains sheets (e.g. Day 1, Day 2) with active data layers.</div>
        </div>
        """, unsafe_allow_html=True)
        return

    st.markdown("<p style='font-size: 0.725rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #818cf8; margin-top: 1rem; margin-bottom: 0.5rem;'>Choose Section / Day</p>", unsafe_allow_html=True)

    # Output sheets dynamically sorted
    for day_name, df in days_data.items():
        count = len(df)
        col_main, col_trigger = st.columns([3.8, 1.2])
        with col_main:
            st.markdown(f"""
            <div class="day-card" style="margin: 0; min-height: 52px; display: flex; align-items: center;">
                <div style="font-weight: 700; font-size: 1.05rem; color: #f8fafc; width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <span>{day_name}</span>
                    <span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.12); color: #818cf8;
                    padding: 0.25rem 0.65rem; border-radius: 999px; border: 1px solid rgba(99, 102, 241, 0.25); font-family: 'JetBrains Mono', monospace; font-weight: 600;">
                        {count} terms
                    </span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with col_trigger:
            if st.button("Start ➔", key=f"btn_{selected_level}_{day_name}", use_container_width=True):
                # Init practice state
                st.session_state.level = selected_level
                st.session_state.day = day_name
                # Randomize current deck
                st.session_state.deck = df.sample(frac=1).reset_index(drop=True).to_dict(orient="records")
                st.session_state.idx = 0
                st.session_state.score = 0
                st.session_state.attempts = 0
                st.session_state.streak = 0
                st.session_state.answered = False
                st.session_state.selected = None
                st.session_state.show_image = False
                st.session_state.card_images = {}
                st.session_state.audio_trigger = None
                st.session_state.screen = "quiz"
                st.rerun()

    # Marathon Study Block if more than 1 sheet exists
    if len(days_data) > 1:
        st.markdown("<div style='margin: 1.8rem 0; height: 1px; background: rgba(255, 255, 255, 0.08)'></div>", unsafe_allow_html=True)
        col_main, col_trigger = st.columns([3.8, 1.2])
        total_all = sum(len(df) for df in days_data.values())
        with col_main:
            st.markdown(f"""
            <div class="day-card" style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(9, 9, 11, 0.2)); border-color: rgba(99, 102, 241, 0.2); margin: 0;">
                <div style="font-weight: 800; font-size: 1.05rem; color: #a5b4fc; display: flex; justify-content: space-between; align-items: center;">
                    <span>Marathon Shuffler</span>
                    <span style="font-size: 0.75rem; background: #4f46e5; color: #ffffff;
                    padding: 0.25rem 0.65rem; border-radius: 999px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">{total_all} terms</span>
                </div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.35rem; line-height: 1.3;">Shuffle and study all sections together in one session.</div>
            </div>
            """, unsafe_allow_html=True)
        with col_trigger:
            if st.button("Marathon", key=f"marathon_{selected_level}", use_container_width=True):
                all_layers = []
                for _, layer_df in days_data.items():
                    all_layers.append(layer_df)
                merged = pd.concat(all_layers, ignore_index=True)
                
                st.session_state.level = selected_level
                st.session_state.day = "Marathon Shuffler"
                st.session_state.deck = merged.sample(frac=1).reset_index(drop=True).to_dict(orient="records")
                st.session_state.idx = 0
                st.session_state.score = 0
                st.session_state.attempts = 0
                st.session_state.streak = 0
                st.session_state.answered = False
                st.session_state.selected = None
                st.session_state.show_image = False
                st.session_state.card_images = {}
                st.session_state.audio_trigger = None
                st.session_state.screen = "quiz"
                st.rerun()


# ══════════════════════════════════════
# SCREEN: ACTIVE STUDY ENTRANCE (Quiz)
# ══════════════════════════════════════
def render_quiz():
    render_brand_header()
    deck = st.session_state.deck
    idx = st.session_state.idx

    if idx >= len(deck):
        st.session_state.screen = "summary"
        st.rerun()
        return

    row = deck[idx]
    total = len(deck)

    word = row.get("german_word", "Word")
    phonetic = row.get("pronunciation", "")
    meaning = row.get("meaning", "")
    example = row.get("example_sentence", "")
    note = row.get("note", "")
    gender = row.get("gender", "")
    emoji = row.get("emoji", "") or "🇩🇪"
    keyword = row.get("keyword", "")

    # Clean flags based on metadata strings
    is_verb = str(row.get("note", "")).strip().lower() == "verb" or "verb" in str(row.get("gender","")).lower()
    is_adj = "adjective" in str(row.get("gender","")).lower() or str(row.get("note", "")).strip().lower() == "adjective"
    is_prep = "preposition" in str(row.get("gender","")).lower() or str(row.get("note", "")).strip().lower() == "preposition"

    st.markdown(f'<div style="text-align:center; font-size:0.8rem; color:#818cf8; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:0.75rem">{st.session_state.level} — {st.session_state.day}</div>', unsafe_allow_html=True)

    # Nav controllers on top row
    render_navigation_header()

    # Glass Vocabulary Card Container
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    
    # Progress Indicators and streak metrics
    col_metrics_l, col_metrics_r = st.columns([1, 1])
    with col_metrics_l:
        st.markdown(f'<div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8;">Card {idx+1} of {total}</div>', unsafe_allow_html=True)
    with col_metrics_r:
        st.markdown(f'<div style="text-align: right;"><div class="streak-box">🔥 {st.session_state.streak} streak</div></div>', unsafe_allow_html=True)

    st.progress((idx) / total)

    # Word & Part of speech badges
    col_dummy, col_gender_badge = st.columns([3, 1])
    with col_gender_badge:
        badge_html = render_badge(gender, is_verb, is_adj, is_prep)
        st.markdown(f'<div style="text-align: right; margin-top: 0.5rem">{badge_html}</div>', unsafe_allow_html=True)

    # Retrieve & Cache visual association images
    img_container = st.container()
    with img_container:
        if st.session_state.show_image or st.session_state.answered:
            if idx not in st.session_state.card_images:
                # Resolve query for fetching correct illustrations
                search_query = keyword if keyword else word
                img_url = fetch_image_url(search_query)
                st.session_state.card_images[idx] = img_url
            
            chosen_url = st.session_state.card_images[idx]
            if chosen_url:
                st.image(chosen_url, width=130)
        else:
            if st.button("👁️ Show Cue Image", key="btn_reveal_img", use_container_width=True):
                st.session_state.show_image = True
                st.rerun()

    # Core German display
    st.markdown(f'<div style="text-align: center; font-size: 1.2rem; margin-bottom: 0.2rem;">{emoji}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="german-word">{word}</div>', unsafe_allow_html=True)
    if phonetic:
        st.markdown(f'<div style="text-align: center; margin-bottom: 0.75rem;"><span class="phonetic">[{phonetic}]</span></div>', unsafe_allow_html=True)
    if note and str(note).lower() != "nan" and str(note).lower() != "":
         st.markdown(f'<div style="text-align: center; margin-bottom: 0.75rem;"><span class="note-text">{note}</span></div>', unsafe_allow_html=True)

    # Example Sentence with Highlighted Vocab Word shown directly below word
    if example:
        highlighted_sentence = format_example_sentence(example, word)
        st.markdown(f"""
        <div style="background: rgba(99, 102, 241, 0.04); border: 1px solid rgba(99, 102, 241, 0.1); border-radius: 16px; padding: 1rem 1.25rem; margin: 1rem 0; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-bottom: 0.4rem;">
                <div style="width: 6px; height: 6px; border-radius: 99px; background-color: #818cf8;"></div>
                <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #a5b4fc;">Context Example Sentence</span>
            </div>
            <p style="color: #cbd5e1; font-style: italic; margin: 0; line-height: 1.4; font-size: 0.875rem;">
                "{highlighted_sentence}"
            </p>
        </div>
        """, unsafe_allow_html=True)

    # Pronunciation Playback Controls Row matching React normal/slow/spell
    col_p1, col_p2, col_p3 = st.columns(3)
    with col_p1:
        if st.button("Normal 🔊", key=f"btn_p_normal_{idx}", use_container_width=True):
            st.session_state.audio_trigger = "pronounce"
    with col_p2:
        if st.button("Slow 🐢", key=f"btn_p_slow_{idx}", use_container_width=True):
            st.session_state.audio_trigger = "slow"
    with col_p3:
        if st.button("Spell 🗣️", key=f"btn_p_spell_{idx}", use_container_width=True):
            st.session_state.audio_trigger = "spell"

    # Play local stream immediately based on state trigger
    row_idx_val = int(row.get("_row_idx", idx))
    level_val = st.session_state.level
    day_val = st.session_state.day

    if st.session_state.audio_trigger:
        mode = st.session_state.audio_trigger
        paths = get_audio_paths(level_val, day_val, row_idx_val, word)
        target_path = paths[mode]
        
        # Pull or compile missing local asset automatically
        if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
            if mode == "spell":
                spell_word(word, level_val, day_val, row_idx_val)
            elif mode == "slow":
                slow_word(word, level_val, day_val, row_idx_val)
            else:
                pronounce_word(word, level_val, day_val, row_idx_val)
                
        embed_play_sound(target_path)
        # Clear playback trigger so it doesn't double-run next click
        st.session_state.audio_trigger = None

    # Play default Normal on loading step once for auto-immersive feedback
    auto_speak_key = f"auto_speak_triggered_{idx}"
    if auto_speak_key not in st.session_state:
        st.session_state[auto_speak_key] = True
        paths = get_audio_paths(level_val, day_val, row_idx_val, word)
        target_path = paths["pronounce"]
        if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
            pronounce_word(word, level_val, day_val, row_idx_val)
        embed_play_sound(target_path)

    st.markdown("<br>", unsafe_allow_html=True)

    # Extract options properly
    correct_meaning = str(meaning).strip()
    opts = [
        str(row.get("option_1", "")).strip(),
        str(row.get("option_2", "")).strip(),
        str(row.get("option_3", "")).strip(),
        str(row.get("option_4", "")).strip()
    ]
    opts = [o for o in opts if o and o.lower() != "nan" and o != ""]
    
    # Normalizing options if index mapping empty
    if correct_meaning not in opts:
        if len(opts) >= 4:
            opts[0] = correct_meaning
        else:
            opts.append(correct_meaning)
            
    # Seed options sequentially relative to card indexes to prevent button jumping
    random.seed(row_idx_val + 42)
    random.shuffle(opts)

    # Option Selection Button Grid Layout
    if not st.session_state.answered:
        col_opts1, col_opts2 = st.columns(2)
        for i, option_str in enumerate(opts):
            col_target = col_opts1 if (i % 2 == 0) else col_opts2
            with col_target:
                if st.button(option_str, key=f"opt_btn_{i}_{idx}", use_container_width=True):
                    st.session_state.answered = True
                    st.session_state.selected = option_str
                    st.session_state.attempts += 1
                    st.session_state.show_image = True
                    if option_str == correct_meaning:
                        st.session_state.score += 1
                        st.session_state.streak += 1
                        st.session_state.max_streak = max(st.session_state.max_streak, st.session_state.streak)
                    else:
                        st.session_state.streak = 0
                    st.rerun()
    else:
        # Display selected outputs with corresponding outline statuses
        selected_option = st.session_state.selected
        is_user_correct = (selected_option == correct_meaning)
        
        col_opts1, col_opts2 = st.columns(2)
        for i, option_str in enumerate(opts):
            col_target = col_opts1 if (i % 2 == 0) else col_opts2
            with col_target:
                if option_str == correct_meaning:
                    st.markdown(f'<div class="opt-btn opt-correct">✓ {option_str}</div>', unsafe_allow_html=True)
                elif option_str == selected_option and not is_user_correct:
                    st.markdown(f'<div class="opt-btn opt-wrong">✗ {option_str}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(f'<div class="opt-btn" style="opacity: 0.35">{option_str}</div>', unsafe_allow_html=True)

        # Highlight descriptive translations and examples matching active retrieval rules
        if is_user_correct:
            st.markdown(f"""
            <div class="fb-correct">
                <div style="font-weight: 800; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.35rem; font-family: monospace;">Richtig! (Correct)</div>
                <div style="font-size: 1.15rem; font-weight: 800; line-height: 1.3;">"{word}" translates exactly to "{correct_meaning}"</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="fb-wrong">
                <div style="font-weight: 800; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.35rem; font-family: monospace;">Falsch! (Incorrect)</div>
                <div style="font-size: 1.15rem; font-weight: 800; line-height: 1.3;">"{word}" corresponds to "{correct_meaning}" (not "{selected_option}")</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Continue Study ➔", key="btn_next_primary_action", type="primary", use_container_width=True):
            st.session_state.idx += 1
            st.session_state.answered = False
            st.session_state.selected = None
            st.session_state.show_image = False
            st.session_state.audio_trigger = None
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════
# SCREEN: ACTIVE WORD BROWSER
# ══════════════════════════════════════
def render_browse():
    render_brand_header()
    deck = st.session_state.deck
    level = st.session_state.level
    day = st.session_state.day

    st.markdown(f'<div style="text-align:center; font-size:0.8rem; color:#818cf8; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:0.75rem">{level} — {day}</div>', unsafe_allow_html=True)

    # Nav controllers on top row to match Play Quiz layout
    render_navigation_header()

    # Cards layout wrapper
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown('<h3 style="margin-top: 0; font-weight: 800; color: #ffffff; font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">📖 Word Browser</h3>', unsafe_allow_html=True)
    st.markdown('<p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.4;">Review and search vocabulary terms loaded in this level set day. Expand cards to view details, retrieve associate cue photos, and play speed vocals.</p>', unsafe_allow_html=True)

    # Search bar filter matches React Filter by German or English...
    search_q = st.text_input("Search words, definitions, and examples...", placeholder="Filter by German or English...", key="browse_search_field")
    st.markdown("<div style='margin-bottom: 1.2rem;'></div>", unsafe_allow_html=True)

    # Filter deck words
    filtered_deck = []
    for w in deck:
        g_word = str(w.get("german_word", "")).lower()
        meaning_val = str(w.get("meaning", "")).lower()
        ex_sentence = str(w.get("example_sentence", "")).lower()
        
        if not search_q.strip() or (search_q.lower() in g_word or search_q.lower() in meaning_val or search_q.lower() in ex_sentence):
            filtered_deck.append(w)

    if not filtered_deck:
        st.markdown('<div style="text-align:center; color:#64748b; font-size:0.9rem; padding:3rem 0;">No words matched your search criteria.</div>', unsafe_allow_html=True)
    else:
        # Loop over filtered deck and build premium expanders
        for i, row in enumerate(filtered_deck):
            word = row.get("german_word", "")
            meaning = row.get("meaning", "")
            phonetic = row.get("pronunciation", "")
            ex = row.get("example_sentence", "")
            note = row.get("note", "")
            gender = row.get("gender", "")
            emoji = row.get("emoji", "") or "🇩🇪"
            row_idx_val = int(row.get("_row_idx", i))
            
            # Clean flags
            is_verb = str(note).strip().lower() == "verb" or "verb" in str(gender).lower()
            is_adj = "adjective" in str(gender).lower() or str(note).strip().lower() == "adjective"
            is_prep = "preposition" in str(gender).lower() or str(note).strip().lower() == "preposition"
            badge_html = render_badge(gender, is_verb, is_adj, is_prep)

            # Styled container card for browse line item
            st.markdown(f"""
            <div style="background: rgba(22, 28, 45, 0.4); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 1rem 1.25rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
                    <div>
                        <span style="font-size: 1.1rem; margin-right: 0.3rem;">{emoji}</span>
                        <strong style="font-size: 1.15rem; color: #ffffff;">{word}</strong>
                        {f'<span style="font-family: monospace; font-size: 0.8rem; color: #a5b4fc; margin-left: 0.5rem; background: rgba(99,102,241,0.08); padding:0.15rem 0.45rem; border-radius:4px;">[{phonetic}]</span>' if phonetic else ''}
                    </div>
                    <div>
                        {badge_html}
                    </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: inline-flex; align-items: center;">
                        <span style="background: rgba(99, 102, 241, 0.12); color: #818cf8; font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2);">
                            {meaning}
                        </span>
                        {f'<span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; margin-left: 0.8rem; font-family: monospace;">{note}</span>' if note and str(note).lower() != "nan" else ''}
                    </div>
                </div>
            """, unsafe_allow_html=True)

            with st.expander("👁️ View Context & Visual Associations", expanded=False):
                col_info_pane, col_voice_pane = st.columns([2, 1])
                
                with col_info_pane:
                    if ex:
                        highlighted_sentence = format_example_sentence(ex, word)
                        st.markdown(f"""
                        <div style="margin-top: 0.4rem; margin-bottom: 0.8rem;">
                            <div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #818cf8; letter-spacing: 0.08em; margin-bottom: 0.25rem;">Context Example Sentence:</div>
                            <div style="font-style: italic; font-size: 0.85rem; color: #e2e8f0; line-height: 1.45;">"{highlighted_sentence}"</div>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    search_query = row.get("keyword", "") or word
                    cache_key = f"b_img_{row_idx_val}"
                    if cache_key not in st.session_state.card_images:
                        st.session_state.card_images[cache_key] = None
                        
                    if st.button("📸 Retrieve Cue Image", key=f"fetch_image_browse_{row_idx_val}"):
                        img_url = fetch_image_url(search_query)
                        st.session_state.card_images[cache_key] = img_url
                        st.rerun()
                        
                    url_to_show = st.session_state.card_images[cache_key]
                    if url_to_show:
                        st.image(url_to_show, width=120)
                        
                with col_voice_pane:
                    st.markdown('<div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #818cf8; letter-spacing: 0.08em; margin-bottom: 0.4rem; text-align: center; font-family: monospace;">Speeds:</div>', unsafe_allow_html=True)
                    
                    if st.button("Normal 🔊", key=f"btn_b_normal_{row_idx_val}", use_container_width=True):
                        st.session_state.audio_trigger = f"browse_pronounce_{row_idx_val}"
                    if st.button("Slow 🐢", key=f"btn_b_slow_{row_idx_val}", use_container_width=True):
                        st.session_state.audio_trigger = f"browse_slow_{row_idx_val}"
                    if st.button("Spell 🗣️", key=f"btn_b_spell_{row_idx_val}", use_container_width=True):
                        st.session_state.audio_trigger = f"browse_spell_{row_idx_val}"
            
            st.markdown('</div>', unsafe_allow_html=True) # close browse row card div

        # Global audio trigger handler for word browser
        if st.session_state.audio_trigger and st.session_state.audio_trigger.startswith("browse_"):
            trigger_parts = st.session_state.audio_trigger.split("_")
            b_mode = trigger_parts[1]
            b_row_idx = int(trigger_parts[2])
            
            # Find the word matching this index
            matched_row = next((r for r in deck if int(r.get("_row_idx", -1)) == b_row_idx), None)
            if matched_row:
                b_word = matched_row.get("german_word", "")
                paths = get_audio_paths(level, day, b_row_idx, b_word)
                target_path = paths[b_mode]
                
                # Fetch dynamically
                if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
                    if b_mode == "spell":
                        spell_word(b_word, level, day, b_row_idx)
                    elif b_mode == "slow":
                        slow_word(b_word, level, day, b_row_idx)
                    else:
                        pronounce_word(b_word, level, day, b_row_idx)
                
                embed_play_sound(target_path)
            st.session_state.audio_trigger = None

    st.markdown('</div>', unsafe_allow_html=True)


# ══════════════════════════════════════
# SCREEN: COMPLETED PRACTICE METRICS
# ══════════════════════════════════════
def render_summary():
    render_brand_header()
    st.markdown('<div style="text-align:center; margin-top:1.5rem"><span style="font-size:3.5rem">🏆</span></div>', unsafe_allow_html=True)
    st.markdown('<h1 style="text-align:center; font-weight:800; font-size:2.6rem; color:#ffffff; margin:0">Tag Abgeschlossen!</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align:center; color:#64748b; font-size:1.1rem; margin-top: 0.35rem;">You have finished all words in this active study deck.</p>', unsafe_allow_html=True)

    total = len(st.session_state.deck)
    score = st.session_state.score
    attempts = st.session_state.attempts
    accuracy_percentage = round((score / attempts) * 100) if attempts > 0 else 0
    best_streak = st.session_state.max_streak

    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    col_stat1, col_stat2, col_stat3 = st.columns(3)
    with col_stat1:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-label">Final Score</div>
            <div class="stat-value" style="color:#818cf8">{score}/{total}</div>
        </div>
        """, unsafe_allow_html=True)
    with col_stat2:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-label font-bold">Accuracy</div>
            <div class="stat-value" style="color:#34d399">{accuracy_percentage}%</div>
        </div>
        """, unsafe_allow_html=True)
    with col_stat3:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-label">Max Streak</div>
            <div class="stat-value" style="color:#fbbf24">{best_streak} 🔥</div>
        </div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    
    col_action_left, col_action_right = st.columns(2)
    with col_action_left:
        if st.button("Shuffle & Retry", key="btn_repeat_deck", type="primary", use_container_width=True):
            # Reshuffle active section
            random.seed(time.time())
            deck_list = list(st.session_state.deck)
            random.shuffle(deck_list)
            st.session_state.deck = deck_list
            st.session_state.idx = 0
            st.session_state.score = 0
            st.session_state.attempts = 0
            st.session_state.streak = 0
            st.session_state.answered = False
            st.session_state.selected = None
            st.session_state.show_image = False
            st.session_state.card_images = {}
            st.session_state.audio_trigger = None
            st.session_state.screen = "quiz"
            st.rerun()
            
    with col_action_right:
        if st.button("Return Dashboard", key="btn_return_dashboard", use_container_width=True):
            st.session_state.screen = "home"
            st.session_state.level = None
            st.session_state.day = None
            st.session_state.deck = []
            st.rerun()


# ── Active Screen Routing Controller ──
if st.session_state.screen == "home":
    render_home()
elif st.session_state.screen == "quiz":
    render_quiz()
elif st.session_state.screen == "browse":
    render_browse()
elif st.session_state.screen == "summary":
    render_summary()
