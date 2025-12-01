"""Queue management API endpoints."""
from fastapi import APIRouter, HTTPException
from ...queue import (
    get_queue_stats,
    get_dead_letter_jobs,
    retry_dead_letter_job,
    clear_dead_letter_queue,
)

router = APIRouter(prefix="/queue", tags=["System"])

@router.get("/stats")
async def queue_stats():
    return get_queue_stats()

@router.get("/dead-letter/{queue_name}")
async def dead_letter_list(queue_name: str):
    if queue_name not in {"email", "sms"}:
        raise HTTPException(status_code=400, detail="Unsupported queue")
    return {"queue": queue_name, "jobs": get_dead_letter_jobs(queue_name)}

@router.post("/dead-letter/{queue_name}/{index}/retry")
async def dead_letter_retry(queue_name: str, index: int):
    if queue_name not in {"email", "sms"}:
        raise HTTPException(status_code=400, detail="Unsupported queue")
    success = retry_dead_letter_job(queue_name, index)
    if not success:
        raise HTTPException(status_code=404, detail="Job index not found")
    return {"status": "requeued", "queue": queue_name, "index": index}

@router.delete("/dead-letter/{queue_name}")
async def dead_letter_clear(queue_name: str):
    if queue_name not in {"email", "sms"}:
        raise HTTPException(status_code=400, detail="Unsupported queue")
    count = clear_dead_letter_queue(queue_name)
    return {"status": "cleared", "queue": queue_name, "count": count}
