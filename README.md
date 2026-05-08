# 📸 Instagram Downloader API
### Telegram Bot aur Web Apps ke liye Complete Instagram Media Download API

---

## 🗂️ Project Structure

```
insta-dl-api/
├── index.js              ← Main Express server (Vercel entry point)
├── vercel.json           ← Vercel configuration
├── package.json          ← Dependencies
├── .env.example          ← Environment variables template
├── lib/
│   ├── instagramScraper.js  ← Core Instagram scraping logic
│   └── auth.js              ← API key authentication
├── instagram_api.py      ← Python client (SACHIN.py ke liye)
└── telegram_bot_example.js  ← JS bot example
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check & docs |
| POST | `/api/download` | Photo/Video/Reel/Carousel |
| POST | `/api/story` | User stories |
| POST | `/api/highlights` | Highlights list |
| POST | `/api/highlight/media` | Specific highlight media |
| GET | `/api/profile/:username` | Profile info |

---

## 🔐 Authentication

Har request mein yeh header bhejo:
```
x-api-key: your_secret_api_key_here
```

---

## 📡 API Usage Examples

### 1. Post/Reel/Video Download
```bash
curl -X POST https://your-api.vercel.app/api/download \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/ABC123/"}'
```

**Response:**
```json
{
  "success": true,
  "type": "GraphVideo",
  "caption": "Post caption...",
  "author": "username",
  "likes": 1234,
  "media": [
    {
      "type": "video",
      "url": "https://cdn.instagram.com/video.mp4",
      "thumbnail": "https://cdn.instagram.com/thumb.jpg",
      "duration": 30.5
    }
  ]
}
```

### 2. Story Download
```bash
curl -X POST https://your-api.vercel.app/api/story \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username": "cristiano", "session_id": "YOUR_SESSION_ID"}'
```

### 3. Highlights List
```bash
curl -X POST https://your-api.vercel.app/api/highlights \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username": "instagram", "session_id": "YOUR_SESSION_ID"}'
```

### 4. Highlight Media
```bash
curl -X POST https://your-api.vercel.app/api/highlight/media \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"highlight_id": "17865955229085400", "session_id": "YOUR_SESSION_ID"}'
```

### 5. Profile Info
```bash
curl https://your-api.vercel.app/api/profile/instagram \
  -H "x-api-key: YOUR_KEY"
```

---

## ☁️ VERCEL PAR DEPLOY KAISE KARO (Step by Step)

### Step 1: GitHub Account banaao (agar nahi hai)
- https://github.com par jaao
- Sign up karo

### Step 2: Repository banao
1. GitHub par **"New repository"** click karo
2. Name rakho: `insta-dl-api`
3. **Public** select karo
4. **Create repository** click karo

### Step 3: Code upload karo
```bash
# Apne PC mein yeh commands run karo

# Git initialize karo
git init

# Saari files add karo
git add .

# Commit karo
git commit -m "Initial commit"

# GitHub se connect karo (apna username daalo)
git remote add origin https://github.com/YOUR_USERNAME/insta-dl-api.git

# Push karo
git push -u origin main
```

### Step 4: Vercel Account
1. https://vercel.com par jaao
2. **"Sign Up with GitHub"** karo
3. GitHub account se login karo

### Step 5: Project Import karo
1. Vercel dashboard mein **"Add New Project"** click karo
2. **"Import Git Repository"** mein `insta-dl-api` select karo
3. **"Import"** click karo

### Step 6: Environment Variables Set karo ⚠️ IMPORTANT
Vercel project settings mein jaao:
1. **Settings** → **Environment Variables**
2. Yeh variables add karo:

| Name | Value |
|------|-------|
| `API_KEY` | `apna_secret_key_yahan` (koi bhi strong password) |
| `INSTAGRAM_SESSION_ID` | Instagram session cookie (neeche guide hai) |

### Step 7: Deploy!
1. **"Deploy"** click karo
2. 2-3 minute wait karo
3. ✅ **Deploy ho gaya!** Tumhe URL milega jaise: `https://insta-dl-api-xyz.vercel.app`

---

## 🍪 Instagram Session ID Kaise Nikalen

Story/Highlight download ke liye session ID zaroori hai:

1. **Chrome browser** mein `instagram.com` open karo
2. Apne account se **login karo**
3. **F12** dabaao (DevTools open hoga)
4. **Application** tab click karo
5. Left panel mein **Cookies** → `https://www.instagram.com` click karo
6. `sessionid` naam ki cookie dhundo
7. Uski **Value** copy karo
8. Yeh value Vercel mein `INSTAGRAM_SESSION_ID` mein paste karo

⚠️ **Note:** Session ID 90 days baad expire hoti hai, dobara set karni hogi.

---

## 🤖 SACHIN.py Mein Integrate Karo

1. `instagram_api.py` file apne bot ke folder mein copy karo
2. `.env` mein add karo:
```env
INSTA_API_URL=https://your-api.vercel.app
INSTA_API_KEY=your_secret_key
```
3. Bot file mein import karo:
```python
from instagram_api import download_media, get_stories, is_instagram_url
```

Detailed example `instagram_api.py` file mein hai.

---

## ⚙️ Local Development

```bash
# Dependencies install karo
npm install

# .env file banao
cp .env.example .env
# .env file edit karo apni values ke saath

# Server start karo
npm run dev
# ya
node index.js

# Test karo
curl -X POST http://localhost:3000/api/download \
  -H "x-api-key: your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/SHORTCODE/"}'
```

---

## ⚠️ Important Notes

1. **Public posts** session ID ke bina bhi download ho sakte hain
2. **Private accounts** ke liye session ID zaroori hai (aur account follow karna hoga)
3. **Stories & Highlights** ke liye HAMESHA session ID chahiye
4. Instagram rate limiting karta hai — zyada requests mat bhejo ek saath
5. Session ID doosron ke saath share mat karo

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `401 Unauthorized` | API key check karo header mein |
| `No active stories` | Account ki stories expire ho gayi ya session invalid |
| `Media not found` | Post private hai ya deleted |
| `Rate limited` | Kuch der baad try karo |
| Vercel deploy fail | Environment variables check karo |

---

## 📞 Support
Telegram: @your_support_handle
