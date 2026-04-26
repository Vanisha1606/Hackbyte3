"""PharmaHub AI Service.

- OCR: Tesseract (primary) with optional Gemini Vision enhancement when
  Tesseract output looks weak (handwritten / low confidence scans).
- Medicine identification & info: Gemini.
- Chat: Gemini.
"""

import os
import re
import shutil
from typing import List, Optional

import cv2
import numpy as np
import pytesseract
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "").strip()

# Auto-detect tesseract: try env var, then ~/.local/bin/tesseract, then PATH.
def _resolve_tesseract() -> Optional[str]:
    if TESSERACT_CMD and os.path.isfile(TESSERACT_CMD):
        return TESSERACT_CMD
    home_bin = os.path.expanduser("~/.local/bin/tesseract")
    if os.path.isfile(home_bin):
        return home_bin
    found = shutil.which("tesseract")
    return found


_TESS_PATH = _resolve_tesseract()
if _TESS_PATH:
    pytesseract.pytesseract.tesseract_cmd = _TESS_PATH

app = FastAPI(title="PharmaHub AI Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Gemini client
# ---------------------------------------------------------------------------

_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not GEMINI_API_KEY:
        return None
    try:
        from google import genai  # type: ignore

        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        return _gemini_client
    except Exception as exc:  # pragma: no cover
        print(f"[PharmaHub AI] Failed to init Gemini client: {exc}")
        return None


def _gemini_generate(prompt: str) -> str:
    client = get_gemini_client()
    if client is None:
        return (
            "Gemini API key is not configured. Set GEMINI_API_KEY in "
            "fastapi_backend/.env to enable AI replies."
        )
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return getattr(response, "text", "") or "(no response)"
    except Exception as exc:
        msg = str(exc)
        if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
            return (
                "AI quota exhausted on this Gemini project. Either wait a "
                "minute and retry, switch GEMINI_MODEL in fastapi_backend/.env "
                "to a model with available free quota (e.g. gemini-1.5-flash, "
                "gemini-1.5-flash-8b), or generate a fresh API key from a new "
                "Google AI Studio project."
            )
        return f"AI service error: {exc}"


def _gemini_vision_enhance(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """Use Gemini Vision to (re-)read prescription text. Used as a fallback
    when Tesseract output is empty or clearly garbage."""
    client = get_gemini_client()
    if client is None:
        return ""
    try:
        from google.genai import types  # type: ignore

        instruction = (
            "You are an OCR engine. Read this prescription image carefully and "
            "transcribe ALL visible text (medicine names, dosages, instructions, "
            "doctor notes, etc.). Return ONLY the raw text exactly as it appears, "
            "preserving line breaks. Do not add commentary."
        )
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                instruction,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
        return (getattr(response, "text", "") or "").strip()
    except Exception as exc:
        print(f"[PharmaHub AI] Vision fallback failed: {exc}")
        return ""


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes.")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Slight denoise + adaptive threshold helps handwritten Rx scans.
    gray = cv2.fastNlMeansDenoising(gray, None, 12, 7, 21)
    return gray


def tesseract_extract(image_bytes: bytes) -> str:
    if not _TESS_PATH:
        return ""
    try:
        gray = preprocess_image(image_bytes)
        text = pytesseract.image_to_string(gray)
        return (text or "").strip()
    except pytesseract.TesseractNotFoundError:
        return ""
    except Exception as exc:
        print(f"[PharmaHub AI] Tesseract error: {exc}")
        return ""


def _looks_weak(text: str) -> bool:
    """Heuristic to decide if OCR output is too thin / garbled to trust."""
    cleaned = re.sub(r"\s+", "", text)
    if len(cleaned) < 8:
        return True
    # Mostly non-alphanumeric? probably garbage.
    alnum = sum(1 for c in cleaned if c.isalnum())
    return alnum / max(1, len(cleaned)) < 0.4


def clean_prescription_text(raw_text: str) -> str:
    lines = raw_text.split("\n")
    cleaned = []
    medicine_section = False
    for line in lines:
        line = line.strip()
        if re.search(r"\b(Medicine|Rx|TAB\.|CAP\.|SYP\.)\b", line, re.IGNORECASE):
            medicine_section = True
        if medicine_section:
            line = re.sub(
                r"\b(Morning|Night|Aft|Eve)\b",
                lambda m: m.group(0).capitalize(),
                line,
                flags=re.IGNORECASE,
            )
            line = re.sub(
                r"(Before|After)\s+Food",
                lambda m: m.group(0).lower(),
                line,
                flags=re.IGNORECASE,
            )
            line = re.sub(r"\s+", " ", line)
            line = re.sub(r"\(Tot:(.*?)\)", "", line)
        cleaned.append(line)
    text = "\n".join(cleaned)
    text = re.sub(r"\s*\|\s*", "\n", text)
    text = re.sub(r"(\d+\))", r"\n\1", text)
    return text.strip()


def get_medicine_info(name: str) -> str:
    prompt = (
        f"Provide a short medical description of the medicine '{name}', "
        "including its usage and side effects. Keep it concise (2-3 short "
        "sentences). Plain prose, no markdown headers."
    )
    return _gemini_generate(prompt)


def validate_and_extract_medicines(text: str) -> str:
    prompt = (
        "Extract medicines from the following prescription text. For each "
        "medicine output ONE line in the EXACT pipe-separated format:\n"
        "- <Medicine name with strength> | qty: <integer> | price: <integer rupees>\n\n"
        "Rules:\n"
        "1. qty = total tablets/capsules/units to dispense. Infer from "
        "dose * frequency * duration (e.g. '1 tablet twice daily for 5 days' -> qty: 10). "
        "Default to qty: 1 if unsure.\n"
        "2. price = a reasonable estimated retail price in INR (Indian rupees) for "
        "that total quantity in India. Use a realistic round number (no decimals, no symbol). "
        "Default to price: 50 if you genuinely cannot estimate.\n"
        "3. Sentence-case the names. One medicine per line. Nothing else, no headers.\n"
        "4. If no medicines can be identified return exactly: '- (none detected)'.\n\n"
        f"Prescription Text:\n{text}"
    )
    return _gemini_generate(prompt)


def parse_medicine_lines(response_text: str) -> List[dict]:
    """Parse `- Name | qty: N | price: P` lines into structured items."""
    items: List[dict] = []
    for raw in response_text.split("\n"):
        line = raw.strip()
        if not line.startswith("-"):
            continue
        body = line.lstrip("- ").strip()
        if "(none detected)" in body.lower() or not body:
            continue

        qty_match = re.search(r"\|\s*qty:\s*(\d+)", body, re.IGNORECASE)
        # price may be 'price: 120', 'price: ₹120', 'price: Rs 120'
        price_match = re.search(
            r"\|\s*price:\s*[^\d]*(\d+(?:\.\d+)?)",
            body,
            re.IGNORECASE,
        )

        qty = max(1, int(qty_match.group(1))) if qty_match else 1
        price = float(price_match.group(1)) if price_match else 0.0

        # Strip the qty/price annotations from the displayed name.
        cuts = [m.start() for m in [qty_match, price_match] if m]
        name = body[: min(cuts)].strip(" |") if cuts else body

        items.append({"name": name, "quantity": qty, "price": price})
    return items


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


class Message(BaseModel):
    user_input: str


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "PharmaHub AI",
        "tesseract_available": bool(_TESS_PATH),
        "tesseract_path": _TESS_PATH or None,
        "gemini_configured": bool(GEMINI_API_KEY),
        "gemini_model": GEMINI_MODEL,
    }


@app.post("/chat")
async def chat(message: Message):
    prompt = (
        "You are PharmaBot, a friendly medical assistant for the PharmaHub "
        "app. Answer the user's question concisely (2-4 short paragraphs). "
        "If the question isn't medical, answer briefly and politely.\n\n"
        f"User question:\n{message.user_input}"
    )
    return {"reply": _gemini_generate(prompt)}


@app.post("/extract_text/")
async def extract_text(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    primary = tesseract_extract(contents)
    used = "tesseract" if primary else None

    # If Tesseract failed entirely, or output is too weak, ask Gemini Vision.
    if (not primary or _looks_weak(primary)) and GEMINI_API_KEY:
        mime = file.content_type or "image/png"
        vision = _gemini_vision_enhance(contents, mime_type=mime)
        if vision and len(vision) > len(primary):
            primary = vision
            used = "gemini-vision"

    if not primary:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not extract any text from the image. "
                "Tesseract is unavailable and Gemini Vision is not configured. "
                "Install Tesseract or set GEMINI_API_KEY."
            ),
        )

    cleaned = clean_prescription_text(primary)
    return {"extracted_text": cleaned, "engine": used}


@app.post("/validate_prescription/")
async def validate_prescription(data: dict):
    text = (data or {}).get("text", "")
    if not text.strip():
        return {"validated": "- (none detected)", "details": {}}
    response_text = validate_and_extract_medicines(text)
    items = parse_medicine_lines(response_text)
    info = {it["name"]: get_medicine_info(it["name"]) for it in items}
    return {
        "validated": response_text,
        "details": info,
        "medicines": items,
    }


@app.post("/medicine_info/")
async def medicine_info(data: dict):
    medicines: List[str] = (data or {}).get("medicines", [])
    info = {med: get_medicine_info(med) for med in medicines if med}
    return {"medicine_info": info}
