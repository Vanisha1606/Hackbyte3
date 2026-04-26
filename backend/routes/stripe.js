const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const config = require("../config/env");

const stripe = config.STRIPE_SECRET_KEY
  ? Stripe(config.STRIPE_SECRET_KEY)
  : null;

const buildLineItems = (items, amount) => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((it) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: String(it.name || "Medicine").slice(0, 250),
          ...(it.description
            ? { description: String(it.description).slice(0, 500) }
            : {}),
          ...(it.image && /^https?:\/\//.test(it.image)
            ? { images: [it.image] }
            : {}),
        },
        unit_amount: Math.max(50, Math.round((Number(it.price) || 0) * 100)),
      },
      quantity: Math.max(1, Number(it.quantity) || 1),
    }));
  }
  return [
    {
      price_data: {
        currency: "inr",
        product_data: { name: "PharmaHub Order" },
        unit_amount: Math.max(50, Math.round((Number(amount) || 50) * 100)),
      },
      quantity: 1,
    },
  ];
};

router.get("/status", (_req, res) => {
  res.json({
    configured: Boolean(stripe),
    publishable_key_required: true,
  });
});

router.post("/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      message:
        "Stripe is not configured on the server. Add STRIPE_SECRET_KEY in backend/.env to enable checkout.",
    });
  }

  try {
    const { items = [], amount, email } = req.body || {};
    const line_items = buildLineItems(items, amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      ...(email ? { customer_email: email } : {}),
      success_url: `${config.CLIENT_URL}/cart?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.CLIENT_URL}/cart?cancelled=1`,
      shipping_address_collection: {
        allowed_countries: ["IN", "US", "GB", "AE", "SG", "AU", "CA"],
      },
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({
      message: err.message || "Failed to create Stripe checkout session",
    });
  }
});

router.get("/session/:id", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: "Stripe not configured" });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || null,
    });
  } catch (err) {
    res.status(404).json({ message: "Session not found" });
  }
});

module.exports = router;
