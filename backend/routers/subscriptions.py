"""
Subscriptions router — trial tracking, Stripe payments, admin bypass.

Security fix applied: subscription activation is now driven by Stripe
webhooks (stripe_webhook endpoint), NOT by client-submitted payment_intent_id.
The old /activate endpoint is kept for backward compatibility but is hardened.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import stripe
from fastapi import APIRouter, Header, HTTPException, Request

from core.database import db, db_find_one, db_insert_one, db_update_one
from core.models import AdminCodeRequest, CustomerCreate, SubscriptionStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscriptions"])

# Admin bypass code — move to env var in production
ADMIN_CODE = os.environ.get("ADMIN_CODE", "AGORA2025ADMIN")

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

TRIAL_SECONDS = 5400  # 1.5 hours


# ── Internal helpers (imported by other routers) ──────────────────────────────

async def get_subscription_status_internal(device_id: str) -> dict:
    sub = await db_find_one(db.subscriptions, {"device_id": device_id})

    if not sub:
        new_sub = SubscriptionStatus(device_id=device_id)
        await db_insert_one(db.subscriptions, new_sub.model_dump())
        return {
            "status":                  "trial",
            "trial_remaining_seconds": TRIAL_SECONDS,
            "trial_end":               new_sub.trial_end.isoformat(),
            "is_admin":                False,
        }

    if sub.get("is_admin"):
        return {"status": "active", "is_admin": True}

    if sub.get("status") == "active":
        return {"status": "active", "is_admin": False}

    usage = sub.get("usage_seconds", 0)
    if usage >= TRIAL_SECONDS:
        await db_update_one(
            db.subscriptions,
            {"device_id": device_id},
            {"$set": {"status": "expired"}},
        )
        return {"status": "expired", "trial_remaining_seconds": 0, "is_admin": False}

    trial_end = sub.get("trial_end")
    return {
        "status":                  "trial",
        "trial_remaining_seconds": TRIAL_SECONDS - usage,
        "trial_end":               trial_end.isoformat() if isinstance(trial_end, datetime) else trial_end,
        "usage_seconds":           usage,
        "is_admin":                False,
    }


async def track_usage(device_id: str, seconds: int) -> None:
    await db_update_one(
        db.subscriptions,
        {"device_id": device_id},
        {"$inc": {"usage_seconds": seconds}},
        upsert=True,
    )


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/{device_id}")
async def get_subscription_status(device_id: str):
    return await get_subscription_status_internal(device_id)


@router.post("/create-customer")
async def create_customer(request: CustomerCreate):
    try:
        customer = stripe.Customer.create(
            email=request.email,
            name=request.name,
            metadata={"device_id": request.device_id},
        )
        await db_update_one(
            db.subscriptions,
            {"device_id": request.device_id},
            {"$set": {"stripe_customer_id": customer.id, "email": request.email}},
            upsert=True,
        )
        return {"customer_id": customer.id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe create-customer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-payment-intent")
async def create_payment_intent(device_id: str):
    sub = await db_find_one(db.subscriptions, {"device_id": device_id})
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
async def verify_admin_code(request: AdminCodeRequest):
    if request.code != ADMIN_CODE:
        return {"success": False, "message": "Invalid admin code", "is_admin": False}

    await db_update_one(
        db.subscriptions,
        {"device_id": request.device_id},
        {"$set": {"is_admin": True, "status": "active"}},
        upsert=True,
    )
    return {"success": True, "message": "Admin access granted", "is_admin": True}


# ── Private ───────────────────────────────────────────────────────────────────

async def _activate(device_id: str, payment_intent_id: str, customer_id: Optional[str]) -> None:
    update: dict = {
        "status":             "active",
        "activated_at":       datetime.utcnow(),
        "payment_intent_id":  payment_intent_id,
    }
    if customer_id:
        update["stripe_customer_id"] = customer_id

    await db_update_one(
        db.subscriptions,
        {"device_id": device_id},
        {"$set": update},
        upsert=True,
    )
