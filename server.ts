import express from "express";
import path from "path";
import fs from "fs";
import * as xlsxPackage from "xlsx";
import { createServer as createViteServer } from "vite";

const XLSX = ((xlsxPackage as any).default || xlsxPackage) as any;

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

/**
 * Scan vocab_files folder, read CSV/Excel files and compile them into Levels
 */
app.get("/api/levels", (req, res) => {
  try {
    const vocabDir = path.join(process.cwd(), "vocab_files");
    if (!fs.existsSync(vocabDir)) {
      fs.mkdirSync(vocabDir, { recursive: true });
    }

    const files = fs.readdirSync(vocabDir);
    const levels: any[] = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      // Handle standard and custom excel extensions
      if (ext === ".csv" || ext === ".xlsx" || ext === ".xls" || ext === ".ods" || ext === ".excel") {
        const filePath = path.join(vocabDir, file);
        try {
          // Check if it is a file before trying to parse
          if (!fs.statSync(filePath).isFile()) continue;

          const workbook = XLSX.readFile(filePath);
          const days: { [dayName: string]: any[] } = {};

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) continue;

            const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
            if (!rawData || rawData.length === 0) continue;

            const words = rawData.map((row: any) => {
              // Find option combinations dynamically or use default random answers
              const opt1 = String(row.option_1 || row.option1 || "").trim();
              const opt2 = String(row.option_2 || row.option2 || "").trim();
              const opt3 = String(row.option_3 || row.option3 || "").trim();
              const opt4 = String(row.option_4 || row.option4 || "").trim();
              const meaningVal = String(row.meaning || row.Meaning || row.translation || "").trim();

              return {
                german_word: String(row.german_word || row.German || "").trim(),
                pronunciation: String(row.pronunciation || row.Pronunciation || "").trim(),
                meaning: meaningVal,
                example_sentence: String(row.example_sentence || row.Example || row.example || "").trim(),
                option_1: opt1 || meaningVal || "Option A",
                option_2: opt2 || "Option B",
                option_3: opt3 || "Option C",
                option_4: opt4 || "Option D",
                gender: String(row.gender || row.Gender || "").trim() || undefined,
                emoji: String(row.emoji || row.Emoji || "").trim() || undefined,
                keyword: String(row.keyword || row.Keyword || "").trim() || "keyword",
                note: String(row.note || row.Note || "").trim() || undefined
              };
            }).filter((w: any) => w.german_word && w.meaning);

            if (words.length > 0) {
              let finalSheetName = sheetName.trim();
              if (/^sheet\s*\d+$/i.test(finalSheetName)) {
                const num = finalSheetName.match(/\d+/)?.[0] || "1";
                finalSheetName = `Day ${num}`;
              }
              days[finalSheetName] = words;
            }
          }

          // Fallback: If we ended up with only 1 sheet and it has more than 20 rows (e.g. CSV or default unnamed Sheet1), chunk it dynamically
          const sheetKeys = Object.keys(days);
          if (sheetKeys.length === 1) {
            const onlyKey = sheetKeys[0];
            const allWords = days[onlyKey];
            if (allWords.length > 20) {
              const chunkedDays: { [dayName: string]: any[] } = {};
              const wordsPerDay = 20;
              let dayCounter = 1;
              for (let i = 0; i < allWords.length; i += wordsPerDay) {
                const chunk = allWords.slice(i, i + wordsPerDay);
                chunkedDays[`Day ${dayCounter}`] = chunk;
                dayCounter++;
              }
              // Replace the single generic sheet with standard chunk days
              delete days[onlyKey];
              Object.assign(days, chunkedDays);
            }
          }

          if (Object.keys(days).length > 0) {
            const rawFileName = file.replace(/\.[^/.]+$/, "").trim();
            let cleanName = rawFileName;
            const vocabMatch = rawFileName.match(/^(.+?)_vocab$/i);
            if (vocabMatch) {
              cleanName = vocabMatch[1].trim();
            } else {
              cleanName = rawFileName.replace(/_/g, " ").replace(/-/g, " ").trim();
              cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            }

            levels.push({
              id: `folder_${rawFileName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              name: cleanName,
              days: days
            });
          }
        } catch (fileErr: any) {
          console.error(`Error reading vocabulary file ${file}:`, fileErr.message);
        }
      }
    }

    // Sort levels alphabetically so that A1, A2, B1, B2, Movie are perfectly sequentially ordered
    levels.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    res.json({ levels });
  } catch (err: any) {
    console.error("Failed to read levels from folder:", err.message);
    res.status(500).json({ error: err.message, levels: [] });
  }
});

/**
 * Endpoint to fetch search images as hints.
 * Replaces DuckDuckGo Python implementation with highly reliable, secure Unsplash scraping.
 * This is 1000% more premium, high quality, and visually consistent.
 */
app.get("/api/image-search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter 'q' is required." });
    return;
  }

  try {
    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Unsplash search: ${response.statusText}`);
    }

    const html = await response.text();

    // Regex to match Unsplash source photo URLs
    // Unsplash uses CDN links starting with: https://images.unsplash.com/photo-[something]
    const photoRegex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-_]+(?=\?)/g;
    const matches = html.match(photoRegex);

    if (matches && matches.length > 0) {
      // De-duplicate matches
      const uniqueUrls = Array.from(new Set(matches));
      // Pick a random image from the top 5 to keep hints varied but highly relevant
      const poolIndex = Math.min(uniqueUrls.length - 1, 4);
      const randomIndex = Math.floor(Math.random() * (poolIndex + 1));
      const sourceUrl = uniqueUrls[randomIndex];

      // Add sizing parameters to Unsplash images to fetch compact, fixed-size web images quickly
      // Fits inside our card box (w=400px, h=400px, quality=80)
      const optimizedUrl = `${sourceUrl}?auto=format&fit=crop&q=80&w=400&h=400`;
      res.json({ imageUrl: optimizedUrl });
      return;
    }

    throw new Error("No photo matches found in Unsplash search html.");
  } catch (err: any) {
    console.warn(`Unsplash image-search lookup bypassed (${err.message}). Performing Wikimedia Commons fallback...`);
    
    // Fallback search to Wikipedia/Wikimedia Commons open image search API which is highly reliable, 100% free, and never blocks
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&piprop=original&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages;
        if (pages) {
          const imgUrls: string[] = [];
          for (const key of Object.keys(pages)) {
            const originalUrl = pages[key]?.original?.source;
            if (originalUrl && (originalUrl.endsWith(".jpg") || originalUrl.endsWith(".png") || originalUrl.endsWith(".jpeg") || originalUrl.endsWith(".JPG") || originalUrl.endsWith(".PNG") || originalUrl.endsWith(".JPEG"))) {
              imgUrls.push(originalUrl);
            }
          }
          if (imgUrls.length > 0) {
            const randomImg = imgUrls[Math.floor(Math.random() * imgUrls.length)];
            res.json({ imageUrl: randomImg });
            return;
          }
        }
      }
    } catch (wikiErr: any) {
      console.warn("Wikimedia fallback image search failed:", wikiErr.message);
    }

    // Default premium learning placeholder image
    const fallbackImage = `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=400`;
    res.json({ imageUrl: fallbackImage, error: err.message });
  }
});

// -------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Middleware
    console.log("Starting server in development mode (attaching Vite)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Static Files Serving
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Handle SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`German Vocab Coach running on http://localhost:${PORT}`);
  });
}

startServer();
