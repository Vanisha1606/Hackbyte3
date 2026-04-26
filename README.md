# PharmaHub — AI-Powered Pharmacy & Health Companion

PharmaHub is a full-stack application that combines a beautifully consistent
React UI, an Express + MongoDB API for users / orders / Stripe payments / a
Cloudinary-backed prescription archive, and a FastAPI service that handles
real OCR (Tesseract) plus Gemini AI for medicine intelligence and the
PharmaBot chat experience.

```
.
├── backend/          # Node.js + Express + Mongoose API (port 5000)
├── fastapi_backend/  # FastAPI + Tesseract + Gemini AI service (port 8000)
└── frontend/         # React + Vite SPA (port 5173)
```

---

## 1. Prerequisites

| Tool        | Version (recommended) | Used by              |
| ----------- | --------------------- | -------------------- |
| Node.js     | 18+                   | backend, frontend    |
| npm         | 9+                    | backend, frontend    |
| Python      | 3.10+                 | fastapi\_backend     |
| pip         | latest                | fastapi\_backend     |
| MongoDB     | 6+ (community ed.)    | backend              |
| Tesseract   | 4+                    | fastapi\_backend (OCR) |

### Tesseract — system install

```bash
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng
```

### Tesseract — no-sudo install (download deb packages)

```bash
mkdir -p ~/tesseract-pkgs && cd ~/tesseract-pkgs
apt-get download tesseract-ocr tesseract-ocr-eng libtesseract4 liblept5
mkdir -p ~/tesseract-local
for d in *.deb; do dpkg-deb -x "$d" ~/tesseract-local/; done

mkdir -p ~/.local/bin && cat > ~/.local/bin/tesseract <<'EOF'
#!/usr/bin/env bash
TESS_HOME="$HOME/tesseract-local"
export LD_LIBRARY_PATH="$TESS_HOME/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
export TESSDATA_PREFIX="$TESS_HOME/usr/share/tesseract-ocr/4.00/tessdata"
exec "$TESS_HOME/usr/bin/tesseract" "$@"
EOF
chmod +x ~/.local/bin/tesseract
```

The FastAPI service auto-detects `~/.local/bin/tesseract`. You can also set
`TESSERACT_CMD=/path/to/tesseract` in `fastapi_backend/.env`.

### MongoDB — no-sudo install

```bash
mkdir -p ~/mongodb && cd ~/mongodb
curl -fL -o mongo.tgz "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.14.tgz"
tar xzf mongo.tgz && rm mongo.tgz
mkdir -p data log
~/mongodb/mongodb-linux-x86_64-ubuntu2204-7.0.14/bin/mongod \
  --dbpath ~/mongodb/data --logpath ~/mongodb/log/mongod.log \
  --port 27017 --bind_ip 127.0.0.1 --fork
```

---

## 2. Configure environment variables

### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pharmahub
JWT_SECRET=please_change_me_to_a_long_random_string
JWT_EXPIRATION=7d
CLIENT_URL=http://localhost:5173

# Stripe (test mode) - https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary (free tier) - https://console.cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# FastAPI AI service URL
AI_API_URL=http://localhost:8000
```

### `fastapi_backend/.env`

```env
# https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key_here

# Optional override
# TESSERACT_CMD=/home/<you>/.local/bin/tesseract
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 3. Install dependencies (once)

```bash
# Backend (Node.js)
cd backend && npm install && cd ..

# Frontend (React + Vite)
cd frontend && npm install && cd ..

# FastAPI AI service
cd fastapi_backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..
```

---

## 4. Run everything on localhost

Open **four terminals**.

### Terminal 1 — MongoDB

```bash
# system service
sudo systemctl start mongod
# or no-sudo binary (after step 1)
~/mongodb/mongodb-linux-x86_64-ubuntu2204-7.0.14/bin/mongod \
  --dbpath ~/mongodb/data --logpath ~/mongodb/log/mongod.log \
  --port 27017 --bind_ip 127.0.0.1 --fork
```

### Terminal 2 — Node API (port 5000)

```bash
cd backend && npm run dev
```

### Terminal 3 — FastAPI AI (port 8000)

```bash
cd fastapi_backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 4 — Frontend (port 5173)

```bash
cd frontend && npm run dev
```

Open <http://localhost:5173>.

---

## 5. Quick health checks

```bash
curl http://localhost:5000/api/health
curl http://localhost:8000/                    # tesseract_available, gemini_configured
curl http://localhost:5000/api/stripe/status   # configured: true/false
```

---

## 6. Feature map

| Page                       | Route                  | Talks to                                              |
| -------------------------- | ---------------------- | ----------------------------------------------------- |
| Landing dashboard          | `/` and `/home`        | —                                                     |
| Sign up / Login            | `/signup`, `/login`    | Node API (`/auth/*`)                                  |
| Profile / Edit profile     | `/profilepage`         | Node API (`/users/*`)                                 |
| Prescription AI            | `/uploadprescription`  | Node `/api/prescriptions` → Cloudinary + FastAPI OCR |
| My prescriptions           | `/showprescriptions`   | Node `/api/prescriptions` (Mongo + Cloudinary URLs)   |
| PharmaBot chat             | `/chatbot`             | FastAPI (`/chat`, `/extract_text`)                    |
| Pharmacy shop              | `/shop`                | Node API (`/api/medicines`)                           |
| Cart + Stripe checkout     | `/cart`                | Node API (`/api/stripe/*`)                            |
| Admin inventory            | `/admin_inventory`     | Node API (`/api/medicines`)                           |

### Prescription pipeline

1. Frontend uploads image to `POST /api/prescriptions` (Node, JWT-protected).
2. Node uploads to **Cloudinary** (`pharmahub/prescriptions` folder) via
   `multer-storage-cloudinary` and gets a permanent CDN URL.
3. Node forwards the image to **FastAPI** which runs **Tesseract** OCR with
   `cv2` denoising and adaptive thresholding.
4. If Tesseract output looks weak (very short / mostly non-alpha), FastAPI
   automatically retries with **Gemini Vision** as a fallback.
5. Extracted text is sent back through `/validate_prescription/`, which
   asks **Gemini** to extract the medicine list and short descriptions.
6. The full record (image URL, extracted text, medicine list, details,
   engine used) is saved to MongoDB and returned to the UI.
7. `/showprescriptions` lists everything for the signed-in user.

### Stripe checkout

* Real Stripe Checkout — no demo mode. The cart sends `email + line_items`
  to `POST /api/stripe/create-checkout-session`. The user is redirected to
  Stripe, then back to `/cart?paid=1&session_id=cs_test_...`.
* The success view fetches `/api/stripe/session/:id` to display the actual
  amount + payment status from Stripe.
* Without `STRIPE_SECRET_KEY`, the backend returns HTTP 503 and the cart
  shows a clear "Stripe is not configured" warning instead of pretending.

---

## 7. Common issues & fixes

| Symptom                                                       | Fix                                                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `MongoDB connection error`                                    | The Node API auto-retries every 5s. Start `mongod` or set `MONGO_URI` in `backend/.env`.                                         |
| `tesseract_available: false` on `GET /`                        | Install Tesseract (see step 1) or point `TESSERACT_CMD` at the binary.                                                            |
| OCR returns garbage / empty                                   | Make sure `GEMINI_API_KEY` is set so the Gemini Vision fallback can rescue weak Tesseract output on handwritten scans.            |
| Chat says *"Gemini API key is not configured"*                 | Set `GEMINI_API_KEY` in `fastapi_backend/.env` and restart FastAPI.                                                              |
| Cart says *"Stripe is not configured"*                         | Add `STRIPE_SECRET_KEY=sk_test_…` to `backend/.env` and restart the Node API.                                                    |
| Prescription image doesn't show up in history                  | Add Cloudinary credentials to `backend/.env`. Without them, OCR still works but images aren't stored permanently.                 |
| CORS error                                                    | Open `http://localhost:5173` (not `127.0.0.1`).                                                                                  |

Happy hacking 💊
