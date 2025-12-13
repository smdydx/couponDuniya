from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
import uuid

from ...database import get_db
from ...models import User
from ...models.newsletter import NewsletterSubscriber, NewsletterCampaign, NewsletterDelivery
from ...security import get_current_user
from ...queue import push_email_job

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: Optional[str] = None


class UnsubscribeRequest(BaseModel):
    email: EmailStr


class CampaignCreate(BaseModel):
    name: str
    subject: str
    preview_text: Optional[str] = None
    html_content: str
    plain_text_content: Optional[str] = None
    send_at: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    preview_text: Optional[str] = None
    html_content: Optional[str] = None
    plain_text_content: Optional[str] = None
    send_at: Optional[datetime] = None


@router.post("/subscribe", response_model=dict)
def subscribe_to_newsletter(
    payload: SubscribeRequest,
    db: Session = Depends(get_db)
):
    """Subscribe to newsletter"""

    # Check if already subscribed
    existing = db.scalar(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == payload.email)
    )

    if existing:
        if existing.status == "active":
            return {
                "success": True,
                "message": "Already subscribed to newsletter"
            }
        else:
            # Reactivate subscription
            existing.status = "active"
            existing.subscribed_at = datetime.utcnow()
            existing.unsubscribed_at = None
            db.commit()

            return {
                "success": True,
                "message": "Newsletter subscription reactivated"
            }

    # Check if user exists
    user = db.scalar(select(User).where(User.email == payload.email))

    # Create new subscription
    subscriber = NewsletterSubscriber(
        email=payload.email,
        name=payload.name or (user.name if user else None),
        user_id=user.id if user else None,
        source=payload.source,
        status="active",
        confirmed_at=datetime.utcnow()  # Auto-confirm for simplicity
    )

    db.add(subscriber)
    db.commit()

    # Send welcome email
    push_email_job(
        "newsletter_welcome",
        payload.email,
        {
            "name": payload.name or "there"
        }
    )

    return {
        "success": True,
        "message": "Successfully subscribed to newsletter"
    }


@router.post("/unsubscribe", response_model=dict)
def unsubscribe_from_newsletter(
    payload: UnsubscribeRequest,
    db: Session = Depends(get_db)
):
    """Unsubscribe from newsletter"""

    subscriber = db.scalar(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == payload.email)
    )

    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if subscriber.status == "unsubscribed":
        return {
            "success": True,
            "message": "Already unsubscribed"
        }

    subscriber.status = "unsubscribed"
    subscriber.unsubscribed_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "message": "Successfully unsubscribed from newsletter"
    }


@router.get("/status", response_model=dict)
def get_subscription_status(
    email: EmailStr,
    db: Session = Depends(get_db)
):
    """Check newsletter subscription status"""

    subscriber = db.scalar(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == email)
    )

    if not subscriber:
        return {
            "success": True,
            "data": {
                "subscribed": False,
                "status": "not_subscribed"
            }
        }

    return {
        "success": True,
        "data": {
            "subscribed": subscriber.status == "active",
            "status": subscriber.status,
            "subscribed_at": subscriber.subscribed_at.isoformat() if subscriber.subscribed_at else None
        }
    }


# Admin endpoints
@router.post("/admin/campaigns", response_model=dict)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db)
):
    """Create a newsletter campaign (Admin only)"""

    campaign = NewsletterCampaign(
        name=payload.name,
        subject=payload.subject,
        preview_text=payload.preview_text,
        html_content=payload.html_content,
        plain_text_content=payload.plain_text_content,
        send_at=payload.send_at,
        status="scheduled" if payload.send_at else "draft"
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return {
        "success": True,
        "message": "Campaign created successfully",
        "data": {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status
        }
    }


@router.get("/admin/campaigns", response_model=dict)
def list_campaigns(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all campaigns (Admin only)"""

    query = select(NewsletterCampaign)

    if status:
        query = query.where(NewsletterCampaign.status == status)

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(NewsletterCampaign.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    campaigns = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "campaigns": [
                {
                    "id": c.id,
                    "name": c.name,
                    "subject": c.subject,
                    "status": c.status,
                    "send_at": c.send_at.isoformat() if c.send_at else None,
                    "sent_at": c.sent_at.isoformat() if c.sent_at else None,
                    "total_recipients": c.total_recipients,
                    "sent_count": c.sent_count,
                    "opened_count": c.opened_count,
                    "clicked_count": c.clicked_count,
                    "created_at": c.created_at.isoformat()
                }
                for c in campaigns
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


@router.post("/admin/campaigns/{id}/send", response_model=dict)
async def send_campaign(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send a campaign immediately (Admin only)"""

    campaign = db.scalar(select(NewsletterCampaign).where(NewsletterCampaign.id == id))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ["draft", "scheduled"]:
        raise HTTPException(status_code=400, detail="Campaign already sent or sending")

    # Get active subscribers
    subscribers = db.scalars(
        select(NewsletterSubscriber).where(NewsletterSubscriber.status == "active")
    ).all()

    if not subscribers:
        raise HTTPException(status_code=400, detail="No active subscribers")

    # Update campaign status
    campaign.status = "sending"
    campaign.total_recipients = len(subscribers)
    db.commit()

    # Queue emails in background
    async def send_to_subscribers():
        for subscriber in subscribers:
            try:
                # Track delivery
                delivery = NewsletterDelivery(
                    campaign_id=campaign.id,
                    subscriber_id=subscriber.id,
                    status="sent",
                    sent_at=datetime.utcnow()
                )
                db.add(delivery)

                # Queue email
                push_email_job(
                    "newsletter_campaign",
                    subscriber.email,
                    {
                        "subject": campaign.subject,
                        "preview_text": campaign.preview_text,
                        "html_content": campaign.html_content,
                        "campaign_id": campaign.id,
                        "subscriber_id": subscriber.id
                    }
                )

                campaign.sent_count += 1

            except Exception as e:
                print(f"Failed to send to {subscriber.email}: {e}")
                campaign.bounced_count += 1

        # Update campaign status
        campaign.status = "sent"
        campaign.sent_at = datetime.utcnow()
        db.commit()

    background_tasks.add_task(send_to_subscribers)

    return {
        "success": True,
        "message": f"Campaign queued for delivery to {len(subscribers)} subscribers"
    }


@router.get("/admin/subscribers", response_model=dict)
def list_subscribers(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all subscribers (Admin only)"""

    query = select(NewsletterSubscriber)

    if status:
        query = query.where(NewsletterSubscriber.status == status)

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(NewsletterSubscriber.subscribed_at))
    query = query.offset((page - 1) * limit).limit(limit)

    subscribers = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "subscribers": [
                {
                    "id": s.id,
                    "email": s.email,
                    "name": s.name,
                    "status": s.status,
                    "source": s.source,
                    "subscribed_at": s.subscribed_at.isoformat() if s.subscribed_at else None
                }
                for s in subscribers
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


@router.get("/admin/stats", response_model=dict)
def get_newsletter_stats(
    db: Session = Depends(get_db)
):
    """Get newsletter statistics (Admin only)"""

    total_subscribers = db.scalar(
        select(func.count()).select_from(NewsletterSubscriber)
    ) or 0

    active_subscribers = db.scalar(
        select(func.count()).select_from(NewsletterSubscriber).where(
            NewsletterSubscriber.status == "active"
        )
    ) or 0

    total_campaigns = db.scalar(
        select(func.count()).select_from(NewsletterCampaign)
    ) or 0

    sent_campaigns = db.scalar(
        select(func.count()).select_from(NewsletterCampaign).where(
            NewsletterCampaign.status == "sent"
        )
    ) or 0

    # Calculate average open rate
    campaigns_with_opens = db.scalars(
        select(NewsletterCampaign).where(NewsletterCampaign.sent_count > 0)
    ).all()

    avg_open_rate = 0
    if campaigns_with_opens:
        total_open_rate = sum(
            (c.opened_count / c.sent_count * 100) if c.sent_count > 0 else 0
            for c in campaigns_with_opens
        )
        avg_open_rate = total_open_rate / len(campaigns_with_opens)

    return {
        "success": True,
        "data": {
            "total_subscribers": total_subscribers,
            "active_subscribers": active_subscribers,
            "unsubscribed": total_subscribers - active_subscribers,
            "total_campaigns": total_campaigns,
            "sent_campaigns": sent_campaigns,
            "average_open_rate": round(avg_open_rate, 2)
        }
    }
