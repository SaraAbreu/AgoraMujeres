"""
Subscriptions router — trial tracking, Stripe payments, admin bypass.

Security fix applied: subscription activation is now driven by Stripe
webhooks (stripe_webhook endpoint), NOT by client-submitted payment_intent_id.
The old /activate endpoint is kept for backward compatibility but is hardened.
"""

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import stripe
from fastapi import APIRouter, Header, HTTPException, Request, Depends
from auth.dependencies import get_current_user

import core.database as core_db
from core.database import db_find_one, db_insert_one, db_update_one
from core.models import AdminCodeRequest, CustomerCreate, SubscriptionStatus
from core.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscriptions"])

# Admin bypass code — move to env var in production
ADMIN_CODE = os.environ.get("ADMIN_CODE", "AGORA2025ADMIN")

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

TRIAL_DAYS = 30


# ── Internal helpers (imported by other routers) ──────────────────────────────

async def get_subscription_status_internal(device_id: str) -> dict:
    sub = await db_find_one(core_db.db.subscriptions, {"device_id": device_id})

    if not sub:
        new_sub = SubscriptionStatus(device_id=device_id)
        await db_insert_one(core_db.db.subscriptions, new_sub.model_dump())
        remaining = int(timedelta(days=TRIAL_DAYS).total_seconds())
        return {
            "status":                  "trial",
            "trial_remaining_seconds": remaining,
            "trial_end":               new_sub.trial_end.isoformat(),
            "is_admin":                False,
        }

    if sub.get("is_admin"):
        return {"status": "active", "is_admin": True}

    if sub.get("status") == "active":
        return {"status": "active", "is_admin": False}

    # Trial basado en fecha: comparamos now() con trial_end
    trial_end = sub.get("trial_end")
    if not trial_end:
        # Documento antiguo sin trial_end — le damos 30 días desde ahora
        trial_end = datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)
        await db_update_one(
            core_db.db.subscriptions,
            {"device_id": device_id},
            {"$set": {"trial_end": trial_end}},
        )

    if isinstance(trial_end, str):
        trial_end = datetime.fromisoformat(trial_end)
    if trial_end.tzinfo is None:
        trial_end = trial_end.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    remaining = int((trial_end - now).total_seconds())

    if remaining <= 0:
        await db_update_one(
            core_db.db.subscriptions,
            {"device_id": device_id},
            {"$set": {"status": "expired"}},
        )
        return {"status": "expired", "trial_remaining_seconds": 0, "is_admin": False}

    return {
        "status":                  "trial",
        "trial_remaining_seconds": remaining,
        "trial_end":               trial_end.isoformat(),
        "is_admin":                False,
    }


async def track_usage(device_id: str, seconds: int) -> None:
    await db_update_one(
        core_db.db.subscriptions,
        {"device_id": device_id},
        {"$inc": {"usage_seconds": seconds}},
        upsert=True,
    )


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/{device_id}")
async def get_subscription_status(device_id: str, user=Depends(get_current_user)):
    if user.get('device_id') != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return await get_subscription_status_internal(device_id)


@router.post("/create-customer")
async def create_customer(request: CustomerCreate, user=Depends(get_current_user)):
    if user.get('device_id') != request.device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    try:
        customer = stripe.Customer.create(
            email=request.email,
            name=request.name,
            metadata={"device_id": request.device_id},
        )
        await db_update_one(
            core_db.db.subscriptions,
            {"device_id": request.device_id},
            {"$set": {"stripe_customer_id": customer.id, "email": request.email}},
            upsert=True,
        )
        return {"customer_id": customer.id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe create-customer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-payment-intent")
async def create_payment_intent(device_id: str, user=Depends(get_current_user)):
    if user.get('device_id') != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    sub = await db_find_one(core_db.db.subscriptions, {"device_id": device_id})
    if not sub or not sub.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="Customer not found. Call /create-customer first.")

    try:
        intent = stripe.PaymentIntent.create(
            amount=1000,          # 10 EUR in cents
            currency="eur",
            customer=sub["stripe_customer_id"],
            metadata={"device_id": device_id},
        )
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe payment-intent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/create-checkout-session")
async def create_checkout_session(device_id: str, plan: str = "monthly", user=Depends(get_current_user)):
    if user.get('device_id') != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    price_id = os.environ.get(
        "STRIPE_PRICE_YEARLY" if plan == "yearly" else "STRIPE_PRICE_MONTHLY"
    )
    if not price_id:
        raise HTTPException(status_code=500, detail="Price ID not configured.")

    sub = await db_find_one(core_db.db.subscriptions, {"device_id": device_id})
    customer_id = sub.get("stripe_customer_id") if sub else None

    try:
        params = {
            "payment_method_types": ["card"],
            "line_items": [{"price": price_id, "quantity": 1}],
            "mode": "subscription",
            "success_url": "https://agoramujeres.syntexia-solutions.es/home?payment=success",
            "cancel_url": "https://agoramujeres.syntexia-solutions.es/home?payment=cancelled",
            "metadata": {"device_id": device_id},
            "subscription_data": {"metadata": {"device_id": device_id}},
        }
        if customer_id:
            params["customer"] = customer_id
        else:
            if sub and sub.get("email"):
                params["customer_email"] = sub["email"]

        session = stripe.checkout.Session.create(**params)
        return {"url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer-portal")
async def create_customer_portal(device_id: str, user=Depends(get_current_user)):
    """
    Crea una sesión del Stripe Billing Portal para que el usuario gestione
    su suscripción (cancelar, cambiar método de pago, ver facturas).
    """
    if user.get('device_id') != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    sub = await db_find_one(core_db.db.subscriptions, {"device_id": device_id})
    if not sub or not sub.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No hay una suscripción activa con Stripe.")

    try:
        session = stripe.billing_portal.Session.create(
            customer=sub["stripe_customer_id"],
            return_url="https://agoramujeres.syntexia-solutions.es/home",
        )
        return {"url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe customer portal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Stripe sends a signed POST here after every payment event.
    This is the ONLY trusted way to activate a subscription.

    Configure in Stripe dashboard:
        Endpoint URL: https://your-domain.com/api/subscription/stripe-webhook
        Events:       payment_intent.succeeded
    """
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("STRIPE_WEBHOOK_SECRET not set — webhook disabled.")
        raise HTTPException(status_code=501, detail="Webhook not configured.")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        logger.warning("Invalid Stripe webhook signature.")
        raise HTTPException(status_code=400, detail="Invalid signature.")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        device_id = pi.get("metadata", {}).get("device_id")
        if device_id:
            await _activate(device_id, pi["id"], pi.get("customer"))
            logger.info(f"Subscription activated via webhook for device {device_id}")

    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        device_id = session.get("metadata", {}).get("device_id")
        customer_id = session.get("customer")
        if device_id:
            await _activate(device_id, session["id"], customer_id)
            if customer_id:
                await db_update_one(
                    core_db.db.subscriptions,
                    {"device_id": device_id},
                    {"$set": {"stripe_customer_id": customer_id}},
                    upsert=True,
                )
            logger.info(f"Subscription activated via checkout for device {device_id}")

    # Always return 200 so Stripe stops retrying
    return {"received": True}


@router.post("/activate")
async def activate_subscription_legacy(device_id: str, payment_intent_id: str):
    """
    Legacy endpoint kept for backward compatibility.
    Hardened: verifies the payment_intent belongs to this device_id.
    Prefer using the Stripe webhook instead.
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail="Payment not completed.")

    # Verify the intent was created for THIS device
    if intent.metadata.get("device_id") != device_id:
        logger.warning(
            f"device_id mismatch on activate: url={device_id} intent={intent.metadata.get('device_id')}"
        )
        raise HTTPException(status_code=403, detail="Payment does not belong to this device.")

    await _activate(device_id, payment_intent_id, intent.customer)
    return {"status": "active", "message": "Subscription activated."}


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("/admin/verify")
@limiter.limit("5/minute")
async def verify_admin_code(request: Request, body: AdminCodeRequest, user=Depends(get_current_user)):
    if user.get('device_id') != body.device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if body.code != ADMIN_CODE:
        return {"success": False, "message": "Invalid admin code", "is_admin": False}

    await db_update_one(
        core_db.db.subscriptions,
        {"device_id": body.device_id},
        {"$set": {"is_admin": True, "status": "active"}},
        upsert=True,
    )
    return {"success": True, "message": "Admin access granted", "is_admin": True}


# ── Private ───────────────────────────────────────────────────────────────────

async def _activate(device_id: str, payment_intent_id: str, customer_id: Optional[str]) -> None:
    update: dict = {
        "status":             "active",
        "activated_at":       datetime.now(timezone.utc),
        "payment_intent_id":  payment_intent_id,
    }
    if customer_id:
        update["stripe_customer_id"] = customer_id

    await db_update_one(
        core_db.db.subscriptions,
        {"device_id": device_id},
        {"$set": update},
        upsert=True,
    )
