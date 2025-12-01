import json, logging, sys, time, uuid
from typing import Any, Dict

REQUEST_ID_HEADER = "X-Request-ID"

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "timestamp": int(time.time() * 1000),
        }
        if hasattr(record, 'request_id'):
            base['request_id'] = getattr(record, 'request_id')
        if record.exc_info:
            base['exc_type'] = record.exc_info[0].__name__ if record.exc_info[0] else None
        return json.dumps(base, ensure_ascii=False)

_json_handler = logging.StreamHandler(sys.stdout)
_json_handler.setFormatter(JsonFormatter())

root = logging.getLogger()
if not root.handlers:
    root.setLevel(logging.INFO)
    root.addHandler(_json_handler)

# Convenience logger
log = logging.getLogger("app")


def with_request_id(logger: logging.Logger, request_id: str):
    class RequestAdapter(logging.LoggerAdapter):
        def process(self, msg, kwargs):
            extra = kwargs.setdefault('extra', {})
            extra['request_id'] = request_id
            return msg, kwargs
    return RequestAdapter(logger, {})
