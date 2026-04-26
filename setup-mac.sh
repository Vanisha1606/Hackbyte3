#!/usr/bin/env bash
# PharmaHub - Mac one-shot setup.
# Installs every system dependency, project dependency, and starts MongoDB.
# Re-run safely - every step is idempotent.

set -e

cd "$(dirname "$0")"
ROOT="$(pwd)"
echo "==> PharmaHub setup starting in $ROOT"

# ---------------------------------------------------------------------------
# 1. Homebrew (the Mac package manager)
# ---------------------------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "==> Installing Homebrew (one-time)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Make brew available in this shell on Apple Silicon
  if [ -d /opt/homebrew/bin ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi

echo "==> Homebrew: $(brew --version | head -1)"

# ---------------------------------------------------------------------------
# 2. System dependencies
# ---------------------------------------------------------------------------
echo "==> Installing Node, Python, Tesseract, MongoDB..."
brew tap mongodb/brew >/dev/null 2>&1 || true

PKGS=(node python tesseract mongodb-community@7.0)
for pkg in "${PKGS[@]}"; do
  if brew list --versions "$pkg" >/dev/null 2>&1; then
    echo "   - $pkg already installed"
  else
    echo "   - installing $pkg"
    brew install "$pkg"
  fi
done

# ---------------------------------------------------------------------------
# 3. Start MongoDB as a background service
# ---------------------------------------------------------------------------
echo "==> Starting MongoDB..."
brew services start mongodb-community@7.0 >/dev/null
sleep 2
if ! pgrep -f mongod >/dev/null; then
  echo "!! MongoDB didn't start cleanly. Check: brew services list"
fi

# ---------------------------------------------------------------------------
# 4. Backend (Node.js)
# ---------------------------------------------------------------------------
echo "==> Installing backend npm packages..."
( cd backend && npm install --silent )

# ---------------------------------------------------------------------------
# 5. Frontend (React + Vite)
# ---------------------------------------------------------------------------
echo "==> Installing frontend npm packages..."
( cd frontend && npm install --silent )

# ---------------------------------------------------------------------------
# 6. FastAPI (Python venv + pip)
# ---------------------------------------------------------------------------
echo "==> Setting up FastAPI virtualenv..."
(
  cd fastapi_backend
  if [ ! -d .venv ]; then
    python3 -m venv .venv
  fi
  source .venv/bin/activate
  pip install --upgrade pip --quiet
  pip install -r requirements.txt --quiet
  deactivate
)

# ---------------------------------------------------------------------------
# 7. Seed .env files from .env.example if missing
# ---------------------------------------------------------------------------
echo "==> Ensuring .env files exist..."
for pair in "backend/.env.example:backend/.env" \
            "fastapi_backend/.env.example:fastapi_backend/.env" \
            "frontend/.env.example:frontend/.env"; do
  src="${pair%%:*}"
  dst="${pair##*:}"
  if [ -f "$src" ] && [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    echo "   - created $dst (fill in your keys!)"
  fi
done

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat <<'EOF'

==========================================================================
PharmaHub install complete.

Next steps:
  1. Fill your API keys into:
       backend/.env            (STRIPE_SECRET_KEY, CLOUDINARY_*)
       fastapi_backend/.env    (GEMINI_API_KEY)
       frontend/.env           (VITE_STRIPE_PUBLISHABLE_KEY)

  2. Start everything:
       ./start-all.sh
     (or open 3 terminals and run each service manually)

  3. Open http://localhost:5173

To stop MongoDB later:
       brew services stop mongodb-community@7.0
==========================================================================
EOF
