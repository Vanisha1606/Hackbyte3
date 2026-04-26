import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  getCart,
  removeFromCart,
  updateQty,
  cartTotal,
  clearCart,
} from "../utils/cart";
import { api } from "../utils/api";
import { getStoredUser } from "../utils/auth";
import { useToast } from "../components/Toast";
import "./cart.css";

const Cart = () => {
  const [items, setItems] = useState(getCart());
  const [busy, setBusy] = useState(false);
  const [stripeStatus, setStripeStatus] = useState({ configured: null });
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const paid = params.get("paid");
  const cancelled = params.get("cancelled");
  const sessionId = params.get("session_id");
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener("cart:update", sync);
    return () => window.removeEventListener("cart:update", sync);
  }, []);

  useEffect(() => {
    api
      .get("/api/stripe/status")
      .then((r) => setStripeStatus(r.data || { configured: false }))
      .catch(() => setStripeStatus({ configured: false }));
  }, []);

  useEffect(() => {
    if (cancelled) {
      toast.info("Payment cancelled.");
      const next = new URLSearchParams(params);
      next.delete("cancelled");
      setParams(next, { replace: true });
    }
    if (paid) {
      toast.success("Payment successful!");
      clearCart();
      setItems([]);
      if (sessionId) {
        api
          .get(`/api/stripe/session/${sessionId}`)
          .then((r) => setPaymentInfo(r.data))
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, cancelled, sessionId]);

  const total = cartTotal();

  const change = (id, d) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    updateQty(id, (item.quantity || 1) + d);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!stripeStatus.configured) {
      toast.error(
        "Stripe is not configured on the server. Add STRIPE_SECRET_KEY in backend/.env."
      );
      return;
    }
    setBusy(true);
    try {
      const user = getStoredUser();
      const r = await api.post("/api/stripe/create-checkout-session", {
        email: user?.email,
        items: items.map((i) => ({
          name: i.name,
          description: i.description,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        })),
      });
      if (r.data?.url) {
        window.location.href = r.data.url;
        return;
      }
      if (r.data?.id && window.Stripe) {
        const stripe = window.Stripe(
          import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        );
        await stripe.redirectToCheckout({ sessionId: r.data.id });
      }
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Could not start checkout. Try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (paid) {
    return (
      <div className="page">
        <div className="card success-card">
          <div className="success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h1>Payment successful</h1>
          <p>
            Thanks for your order — your cart has been cleared and your
            medicines are queued for dispatch.
          </p>
          {paymentInfo && (
            <div className="receipt">
              <div className="receipt-row">
                <span>Amount</span>
                <strong>
                  {(paymentInfo.amount_total / 100).toFixed(2)}{" "}
                  {paymentInfo.currency?.toUpperCase()}
                </strong>
              </div>
              {paymentInfo.customer_email && (
                <div className="receipt-row">
                  <span>Receipt sent to</span>
                  <strong>{paymentInfo.customer_email}</strong>
                </div>
              )}
              <div className="receipt-row">
                <span>Status</span>
                <strong>{paymentInfo.payment_status}</strong>
              </div>
            </div>
          )}
          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/shop")}
            >
              Back to shop
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/showprescriptions")}
            >
              View prescriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your cart</h1>
          <p className="page-subtitle">Review items before checking out.</p>
        </div>
        {items.length > 0 && (
          <button className="btn btn-ghost" onClick={() => clearCart()}>
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={28} style={{ marginBottom: 8 }} />
          <h3>Your cart is empty</h3>
          <p>Add some medicines from the shop to get started.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => navigate("/shop")}
          >
            Browse pharmacy
          </button>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="card cart-list">
            {items.map((it) => (
              <div className="cart-row" key={it.id}>
                <div>
                  <strong>{it.name}</strong>
                  {it.description && (
                    <small className="muted"> — {it.description}</small>
                  )}
                  <div className="cart-row-foot">
                    <span className="med-price">₹{it.price}</span>
                    <div className="qty">
                      <button onClick={() => change(it.id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span>{it.quantity}</span>
                      <button onClick={() => change(it.id, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="cart-row-side">
                  <strong className="cart-line-total">
                    ₹{(it.price * (it.quantity || 1)).toFixed(2)}
                  </strong>
                  <button
                    className="icon-btn"
                    onClick={() => removeFromCart(it.id)}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card cart-summary">
            <h2 className="section-title">Order summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
            <div className="summary-row muted">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="divider" />
            <div className="summary-row big">
              <span>Total</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleCheckout}
              disabled={busy || stripeStatus.configured === false}
            >
              <CreditCard size={16} />
              {busy ? "Redirecting…" : "Checkout with Stripe"}
            </button>
            {stripeStatus.configured === false ? (
              <p className="stripe-note warn">
                <AlertTriangle size={12} /> Stripe is not configured on the
                server. Add <code>STRIPE_SECRET_KEY</code> to{" "}
                <code>backend/.env</code> to enable checkout.
              </p>
            ) : stripeStatus.configured ? (
              <p className="stripe-note">
                <Info size={12} /> Stripe test mode — use card{" "}
                <code>4242 4242 4242 4242</code>, any future date, any CVC.
              </p>
            ) : (
              <p className="stripe-note">Checking Stripe status…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
