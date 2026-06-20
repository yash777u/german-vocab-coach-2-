# 🇩🇪 German Vocab Coach

A modern, high-fidelity interactive application designed to learn German vocabulary with premium pronunciation speed controls, dynamic flashcards, quiz modules, search list filters, and zero-configuration local spreadsheet directory loading.

The project is thoughtfully structured with **two runtime options** based on your target system preference:
1. ⚡ **React + Node.js (Express)**: A premium full-stack web application.
2. 🐍 **Streamlit (Python)**: A lightweight, clean browser-based dashboard option.

---

## 🛠️ Local Setup Guide

Choose the version you prefer to run locally on your system.

### Option A: React + Express (Node.js Full-Stack)
This runs the primary interactive web application utilizing modern glassmorphic styling, responsive transitions, and cached audio elements.

#### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) installed on your computer.

#### 2. Install Dependencies
Navigate to the root directory in your terminal and run:
```bash
npm install
```

#### 3. Start Live Development Server
Launch the dev framework:
```bash
npm run dev
```
Once started, open your browser and navigate to:
👉 **`http://localhost:3000`**

#### 4. Compile Production Build
To build and check compiled assets:
```bash
# Build the client & bundle the server
npm run build

# Start the compiled production build
npm run start
```

---

### Option B: Streamlit (Python Version)
If you prefer running a pure Python layout with fast data manipulation and clean bento cards.

#### 1. Prerequisites
Ensure you have **Python 3.9 or higher** and `pip` installed.

#### 2. Install Python Dependencies
```bash
pip install streamlit pandas openpyxl gtts pillow requests
```

#### 3. Start the Streamlit Application
Run the Streamlit server from your terminal:
```bash
streamlit run streamlit_app.py
```
Streamlit will automatically open your default browser to:
👉 **`http://localhost:8501`**

---

## 📂 Custom Spreadsheet Drop
Both versions dynamically parse your local vocabulary datasets on bootup! Simply place your Excel (`.xlsx`) files into the `vocab_files/` folder:
- **Automatic Loading**: The application reads any sheet named `Day 1`, `Day 2`... or similar and lists them on the homepage.
- **Accepted Columns**:
  - `german_word` — The vocabulary item (e.g., *der Hund*)
  - `meaning` — English translation/explanation
  - `pronunciation` — Phonetic guide (e.g., *hoont*)
  - `example_sentence` — Context usage sentences
  - `gender` — Grammatical masculine/feminine/neuter classification or part of speech
  - `note` — Part of speech or context tags (e.g., *Noun*, *Verb*)
  - `emoji` — Optional emoji representing the object/verb
  - `keyword` — Optional graphic search query overrides for image cards

---

## 🖼️ Images & Visual Association (what image library / service is used)

The app provides visual association cue images for vocabulary cards. Images are fetched at runtime by the Python helper `lib/image_fetcher.py` and displayed in the Streamlit UI (`streamlit_app.py`). Below is a concise explanation of what the code currently does, how it chooses images, and how you can customize or extend the behavior.

What the project uses today
- `lib/image_fetcher.py` — A tiny custom fetcher that:
   - first attempts to find an illustrative image using the Wikimedia/Wikipedia open API (no API key required), returning the first valid image URL found for the query,
   - falls back to a small set of Unsplash-hosted placeholder images (static URLs) if Wikimedia doesn't return a usable image,
   - uses `requests` for HTTP calls and a simple `requests.Session` with a common browser User-Agent header to reduce accidental blocking.
- `streamlit_app.py` — Calls `fetch_image_url(query)` when an image is requested (either automatically when revealing a card or when the user clicks "📸 Retrieve Cue Image" in the Browse view). The returned URL is displayed in Streamlit via `st.image(...)` and cached in `st.session_state.card_images` to avoid repeated lookups.

Key functions
- fetch_image_url(query)
   - Input: any string (the function will use `keyword` column from your spreadsheet when present, otherwise the `german_word`).
   - Behavior: query Wikipedia/Wikimedia's API for pages matching the query and collect any page image URLs (jpg/png/webp). If none are available or the API call fails, choose a static Unsplash image as a fallback.
   - Output: A string URL pointing to an image (or an empty string if the query is empty).

- validate_image_url(url)
   - A small helper that performs a HEAD request and returns True when the image URL is reachable (status code < 400). Currently the Streamlit code doesn't call this automatically, but it's available if you want to add an extra check before rendering images.

How Streamlit uses images
- Quiz cards: when the user reveals an image or answers a card, the app calls `fetch_image_url` and stores the URL in `st.session_state.card_images[idx]`. The image is rendered with `st.image(url, width=130)` and constrained via CSS to a pleasant size.
- Browse view: a per-row "📸 Retrieve Cue Image" button calls `fetch_image_url` with the spreadsheet `keyword` or the word itself and caches the URL under a key like `b_img_<row_idx>`.

Dependencies
- Python packages used: `requests` (for HTTP), and Streamlit for UI. The top-level README install instruction already includes `requests` and `pillow` (Pillow is not required by `image_fetcher.py` but may be useful if you want to pre-process or cache images locally).

Licensing & attribution notes
- Wikimedia / Wikipedia images: images retrieved via the Wikimedia API may be under a variety of licenses; always verify the license on the original page if you plan to redistribute images or use them commercially.
- Unsplash placeholders: the project uses a few static Unsplash-hosted images as fallbacks. Unsplash images are provided under the Unsplash License — attribution is not strictly required for the placeholders used here, but check Unsplash terms if you replace them with other images or depend on them heavily.

Customization tips (recommended)
- Prefer Wikimedia when possible: the current approach already tries Wikimedia first (no API key). It's reliable for named entities and common nouns.
- Use the `keyword` column in your spreadsheets to override search queries when a direct photographic association will be more helpful (for example, set `keyword` to "red backpack" to refine results for "der Rucksack").
- Add `validate_image_url` before rendering if you see broken images frequently. Example quick patch inside `streamlit_app.py` where images are fetched:
   - if validate_image_url(img_url): st.session_state.card_images[idx] = img_url else: st.session_state.card_images[idx] = ""  # and fall back to placeholder
- Integrate Unsplash API (optional): if you want higher quality, curated photos, you can sign up for an Unsplash developer key and query the Unsplash search API instead of the static placeholder list. If you do this, store the API key in an environment variable and avoid committing it.
- Local caching (optional): to improve performance, persist downloaded images to a `cache_images/` folder and serve them via local paths. This also avoids repeated network lookups when running offline or behind rate limits.

Troubleshooting
- Broken images or timeouts: the Wikimedia API requests have short timeouts in `image_fetcher.py`. If your network is slow or blocked, increase the `timeout` value in the fetcher session or run the app with a reliable network.
- No images found for abstract terms: concrete search `keyword` values (e.g., "red apple" rather than "health") improve results. Use spreadsheet overrides for difficult words.

Next steps (optional improvements)
- Add a configuration flag to prefer Unsplash, Wikimedia, or a local cache.
- Add attribution lines in the UI for images when licensing requires it (especially if you integrate other providers).
- Add a small local cache and optional offline mode for images.


## ☁️ Free Hosting Guide

You can host both versions of the application completely for free in just a few minutes!

### 1. Hosting the Streamlit Version (Recommended & Easiest)
**Streamlit Community Cloud** is 100% free, runs continuously, and offers direct integration with GitHub.

1. **Upload to GitHub**: Create a clean repository on GitHub (public or private) and push your files.
2. **Access Streamlit Cloud**: Sign up/Log in to [share.streamlit.io](https://share.streamlit.io/).
3. **Connect & Deploy**:
   - Click **"Create app"**.
   - Select your GitHub repository, specify the `main` branch, and set the entry file path to `streamlit_app.py`.
   - Click **"Deploy!"**.
4. Your application will be live on a custom `.streamlit.app` URL in under 2 minutes. When you update the Excel files in GitHub, it will update the app automatically!

---

### 2. Hosting the Full-Stack React/Express Version
To get the full node/client-server web app online, you can use any of the following free-tier environments:

#### Method I: Render.com (Unified Full-Stack)
Render offers free cloud hosting for Node.js Web Services.

1. Create a free account at [Render.com](https://render.com/).
2. Click **"New +"** and choose **"Web Service"**.
3. Connect your GitHub repository.
4. Configure the build parameters:
   - **Environment/Language**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Render will automatically compile the Vite frontend, bundle the Express backend on Port 3000, and serve your app.

#### Method II: Vercel (Interactive Static Frontend)
If you want to host the React UI as a lightning-fast client-only application:

1. Connect your GitHub account to [Vercel.com](https://vercel.com/).
2. Select your repository.
3. Vercel automatically detects **Vite** as your build framework:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **"Deploy"** to receive an instant, free global URL with SSL enabled.

---

## 🔒 Key Accomplishments
- **Dynamic Content Flow**: Flexible multi-choice grids, random shuffling, marathon study options, and dynamic streak counting.
- **Accurate Real-Time Progress**: Clean horizontal progress bar detailing exactly how many cards remain.
- **Sc Scraping-Prevention Layouts**: Integrated specialized text selection blocks to secure high-value curriculum materials.
- **Clean Voice Playback**: Immediate cached normal, turtle-slow, and spelled vocal rendering matching local German pronunciations.
# german-vocab-coach-2-
