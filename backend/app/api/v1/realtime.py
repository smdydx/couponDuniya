"""WebSocket endpoint streaming Redis Pub/Sub events.
Clients connect to `/api/v1/realtime/ws` to receive JSON messages for
order and cashback events. Extend by publishing to `events:*` channels.
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...redis_client import redis_client
from ...queue import get_queue_stats

router = APIRouter(prefix="/realtime", tags=["System"])


@router.websocket("/ws")
async def realtime_ws(ws: WebSocket):
    await ws.accept()
    pubsub = redis_client.pubsub()
    channels = ["events:orders", "events:cashback"]
    pubsub.subscribe(*channels)
    try:
        while True:
            # Non-blocking check for messages
            message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
            if message:
                try:
                    data = json.loads(message["data"]) if isinstance(message["data"], str) else message["data"]
                except Exception:
                    data = {"raw": message["data"]}
                await ws.send_json({"channel": message["channel"], "data": data})
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        pubsub.close()
    except Exception:
        pubsub.close()
        await ws.close(code=1011)


@router.websocket("/queue/ws")
async def queue_stats_ws(ws: WebSocket):
    """Periodically push queue stats (pending, processing, DLQ) to admin clients."""
    await ws.accept()
    try:
        # Immediate first payload for tests / initial UI render
        try:
            first_stats = get_queue_stats()
        except Exception:
            first_stats = {"email": {"pending": 0, "processing": 0, "dlq": 0}, "sms": {"pending": 0, "processing": 0, "dlq": 0}}
        await ws.send_json({"type": "queue_stats", "data": first_stats})
        # Continue periodic updates
        while True:
            await asyncio.sleep(5)
            try:
                stats = get_queue_stats()
            except Exception:
                stats = {"email": {"pending": 0, "processing": 0, "dlq": 0}, "sms": {"pending": 0, "processing": 0, "dlq": 0}}
            await ws.send_json({"type": "queue_stats", "data": stats})
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await ws.close(code=1011)
        except Exception:
            pass