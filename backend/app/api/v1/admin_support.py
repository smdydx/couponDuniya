from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import Optional
from math import ceil
from pydantic import BaseModel

from ...database import get_db
from ...models import User
from ...models.support_ticket import SupportTicket
from ...dependencies import get_current_admin, require_admin

router = APIRouter(prefix="/admin/support-tickets", tags=["Admin Support"])


class TicketResponse(BaseModel):
    response: str
    status: Optional[str] = None


@router.get("", response_model=dict)
def list_support_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = select(SupportTicket)
    
    if status:
        query = query.where(SupportTicket.status == status)
    
    if priority:
        query = query.where(SupportTicket.priority == priority)
    
    if search:
        query = query.where(
            SupportTicket.subject.ilike(f"%{search}%")
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(SupportTicket.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    tickets = db.scalars(query).all()
    
    tickets_data = []
    for t in tickets:
        tickets_data.append({
            "id": t.id,
            "ticket_number": getattr(t, 'ticket_number', f"TKT-{t.id}"),
            "user_id": t.user_id,
            "subject": t.subject,
            "category": getattr(t, 'category', 'general'),
            "priority": t.priority,
            "status": t.status,
            "message": getattr(t, 'message', ''),
            "admin_response": getattr(t, 'admin_response', None),
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        })
    
    return {
        "success": True,
        "data": {
            "tickets": tickets_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total_count / limit) if total_count else 0,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.get("/{ticket_id}", response_model=dict)
def get_ticket_detail(
    ticket_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    ticket = db.scalar(select(SupportTicket).where(SupportTicket.id == ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {
        "success": True,
        "data": {
            "id": ticket.id,
            "ticket_number": getattr(ticket, 'ticket_number', f"TKT-{ticket.id}"),
            "user_id": ticket.user_id,
            "subject": ticket.subject,
            "category": getattr(ticket, 'category', 'general'),
            "priority": ticket.priority,
            "status": ticket.status,
            "message": getattr(ticket, 'message', ''),
            "admin_response": getattr(ticket, 'admin_response', None),
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        }
    }


@router.patch("/{ticket_id}/respond", response_model=dict)
def respond_to_ticket(
    ticket_id: int,
    payload: TicketResponse,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ticket = db.scalar(select(SupportTicket).where(SupportTicket.id == ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if hasattr(ticket, 'admin_response'):
        ticket.admin_response = payload.response
    if hasattr(ticket, 'assigned_to'):
        ticket.assigned_to = current_admin.id
    if payload.status:
        ticket.status = payload.status
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Response added to ticket",
        "data": {"id": ticket.id, "status": ticket.status}
    }


@router.patch("/{ticket_id}/close", response_model=dict)
def close_ticket(
    ticket_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ticket = db.scalar(select(SupportTicket).where(SupportTicket.id == ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "closed"
    if hasattr(ticket, 'resolved_at'):
        ticket.resolved_at = datetime.utcnow()
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Ticket closed",
        "data": {"id": ticket.id, "status": ticket.status}
    }
