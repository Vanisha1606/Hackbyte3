# PharmaHub & Analytics Platform - Complete Interview Prep Chat Log

This document contains a compilation of all the questions you asked and the detailed answers provided during our session. Use this as your ultimate study guide for your interview!

---

## 🟢 Q1: Can you go through my entire project from start and tell me the entire workflow, how everything is working, and what authentication and Gemini are like from scratch?

**Answer:**
*(This was provided as a comprehensive Walkthrough Artifact. Here is the summary of the architecture and workflow:)*

**1. High-Level Architecture (3 Services):**
- **Frontend:** React 19 + Vite (Port 5173). Handles UI, routing, and user interaction.
- **Node.js Backend:** Express 5 + Mongoose + JWT (Port 5000). Handles authentication, user CRUD, medicine CRUD, and Stripe.
- **Python Backend:** FastAPI + Tesseract + Google Gemini (Port 8000). Handles AI chat, OCR prescription reading, and medicine information retrieval.

**2. Authentication Flow:**
- Uses JWT (JSON Web Tokens) statelessly. 
- During **Signup**, the backend hashes the password using `bcrypt` (10 salt rounds) and stores it in MongoDB. It then generates a JWT token signed with a secret key.
- During **Login**, the backend compares the password hash, and if it matches, issues a JWT token. This token is saved in the frontend's `localStorage` and sent with subsequent requests in the `Authorization: Bearer <token>` header.

**3. The Google Gemini & OCR Workflow (`/extract_text` & `/validate_prescription`):**
- **Upload:** User uploads a prescription image.
- **Prep:** Image is sent to the FastAPI backend where OpenCV converts it to grayscale to improve accuracy.
- **OCR:** Tesseract reads the image and turns the pixels into raw text.
- **AI Extraction:** The noisy raw text is sent to Google Gemini 2.0 Flash with a prompt asking it to extract medicine names as a markdown list.
- **AI Info:** For each medicine extracted, Gemini is prompted again to provide usage and side-effect information.
- **Result:** The structured data is returned to the frontend and displayed to the user.

---

## 🟢 Q2: Can you give me commands to run this project?

**Answer:**
You need **3 terminals** running simultaneously.

**Terminal 1 — Node.js Backend (port 5000)**
```bash
cd /Users/vanishagarg/Desktop/Hackbyte3/backend
npm install
node app.js
```

**Terminal 2 — FastAPI Backend (port 8000)**
```bash
cd /Users/vanishagarg/Desktop/Hackbyte3/fastapi_backend/app
pip install -r requirements.txt
uvicorn main:app --reload
```

**Terminal 3 — React Frontend (port 5173)**
```bash
cd /Users/vanishagarg/Desktop/Hackbyte3/frontend
npm install
npm run dev
```
*(Make sure MongoDB is running and that your `.env` files are configured!)*

---

## 🟢 Q3: What is the Stripe error `Neither apiKey nor config.authenticator provided`?

**Answer:**
The error means `process.env.STRIPE_SECRET_KEY` is `undefined` because there was no `.env` file in the `backend/` folder. The Stripe SDK crashes when it gets no API key. A `.env` file must be created inside `backend/` containing variables like `STRIPE_SECRET_KEY`, `MONGO_URI`, and `JWT_SECRET`.

---

## 🟢 Q4: Can you tell me everything from very basics about JWT Authentication from scratch?

**Answer:**
- **Why we need it:** HTTP is stateless (it forgets you immediately). We need a way for the server to remember who is logged in.
- **The Solution:** A token (like a wristband at a concert). You log in once, get a wristband (JWT), and show it for every subsequent request.
- **What is a JWT?** It's a string made of 3 parts: `HEADER.PAYLOAD.SIGNATURE`.
  1. *Header:* Says "I am a JWT using the HMAC-SHA256 algorithm".
  2. *Payload:* Contains your data (e.g., `{"id": "123", "email": "v@gmail.com"}`). It is NOT encrypted, just encoded (anyone can read it).
  3. *Signature:* A cryptographic stamp made using a SECRET KEY that only the server knows. This proves the token hasn't been tampered with.
- **Password Hashing:** Passwords are never stored in plain text. `bcrypt` turns "password123" into a random, irreversible string (hash). It also adds a "salt" (random data) so even if two users have the same password, their hashes will look completely different.

---

## 🟢 Q5: Explain the entire authentication workflow in an interview format with cross-questions.

**Answer:**
*Q: What authentication method did you use and why?*
I used stateless JWT authentication because it is highly scalable. Unlike session-based auth where the server must store session IDs in memory or a database, JWT requires zero server storage. The server just verifies the signature and trusts the payload.

*Q: Walk me through the Signup flow.*
1. User enters details in React.
2. Axios sends a POST request to `/auth/register`.
3. Express verifies the email domain via DNS MX lookup, then checks if the user exists in MongoDB.
4. `bcrypt` hashes the password with 10 salt rounds.
5. User is saved to MongoDB.
6. Server signs a JWT with `JWT_SECRET` and returns it. Frontend saves it in `localStorage`.

*Q: Where do you store the token? Is it secure?*
I store it in `localStorage`. It's easy, but it is vulnerable to XSS (Cross-Site Scripting) attacks where malicious JavaScript could read the token. A more secure, production-ready approach would be storing it in an `HttpOnly` cookie, which is immune to XSS (though requires CSRF protection).

---

## 🟢 Q6: What does this mean: "Creates a piece of state that, when updated, causes the component to re-render."?

**Answer:**
- **State = a variable that React watches.** When it changes, React automatically updates what's shown on screen (like a scoreboard automatically updating the display when the score changes).
- **Re-render = React re-running your component function** to refresh the screen with the new values. 
- If you use a normal JS variable (`let email = "v"`), React doesn't know it changed, so the screen stays blank. If you use `useState`, using the setter function (`setEmail("v")`) alerts React a change happened, prompting a re-render.

---

## 🟢 Q7: Why use Node.js and FastAPI? Why 2 backends?

**Answer:**
**"I used a microservices approach with two backends because standard web logic and AI/Machine Learning have completely different requirements."**

1. **Node.js (Business Backend):** Extremely fast for standard web app features: user authentication (JWT), MongoDB CRUD operations, and Stripe payments. It's lightweight and handles I/O operations perfectly.
2. **Python/FastAPI (AI/ML Backend):** Python is the undisputed king of AI. Libraries for Computer Vision (OpenCV) and OCR (Tesseract) are native to Python. Integrating Google Gemini is also natively robust here. FastAPI allows this microservice to process heavy images asynchronously without blocking the Node.js server.

---

## 🟢 Q8: Give me the entire workflow for Stripe. What is it and why use it?

**Answer:**
**What it is & Why you used it:**
Stripe is a Payment Gateway. *"I used Stripe because handling credit card data yourself is incredibly risky and requires strict legal compliance (PCI-DSS). With Stripe, the sensitive credit card numbers never touch my backend database. Stripe handles all security and fraud detection."*

**The Workflow:**
1. **Frontend:** User clicks "Pay". React sends a POST request to Node.js backend.
2. **Backend:** Node.js uses its **Secret Key** (`STRIPE_SECRET_KEY`) to securely tell Stripe to create a unique "Checkout Session" for a $50 purchase. Stripe returns a `sessionId`.
3. **Redirect:** The frontend uses the **Publishable Key** (`VITE_STRIPE_PUBLISHABLE_KEY`) and the `sessionId` to redirect the user to a secure payment page hosted strictly on `stripe.com`.
4. **Payment:** User enters card details on Stripe's servers. 
5. **Return:** Stripe redirects the user back to your app's `success_url` or `cancel_url`. (In production, you'd also use a **Webhook** where Stripe secretly messages your backend to confirm payment was officially captured).

---

## 🟢 Q9: Based on my resume points (Next.js, FastAPI, MilvusDB, MongoDB, TensorFlow, TypeScript), why did I use this specific tech stack for my Analytics platform?

**Answer:**
- **Python (FastAPI):** Python is the #1 language for ML models (TensorFlow, clustering, sentiment analysis). FastAPI was structured as an async backend to serve predictions rapidly without blocking dashboard requests.
- **MongoDB:** User events (clicks, funnel drops) are unstructured and have flexible schemas. A NoSQL DB handles event-driven tracking efficiently.
- **MilvusDB:** This is a specialized **Vector Database**. The deep learning model generates vector embeddings for users and items. MilvusDB performs blazing-fast "Similarity Search" (ANN) to match users to items for recommendations. Traditional DBs cannot do this efficiently.
- **TensorFlow:** Used for the Two-Tower deep learning recommendation architecture, behavior clustering, and sentiment analysis.
- **Next.js & TypeScript:** Analytics platforms require heavy data visualizations. Next.js was used for **Server-Side Rendering (SSR)** so data-heavy dashboard pages load instantly without blank loading screens. Next.js API routes act as a secure backend-for-frontend. TypeScript was crucial to ensure there were no bugs while passing highly complex, nested analytics data objects between components.

---

## 🟢 Q10: What is the EASIEST answer for why you used Next.js for the analytics project?

**Answer:**
"I chose Next.js because its **Server-Side Rendering (SSR)** ensures our heavy, real-time analytics visualizations load instantly, without showing the user a blank loading screen, while easily handling fast-changing real-time data."
