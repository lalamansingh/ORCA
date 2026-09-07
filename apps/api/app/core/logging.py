"""Request-aware structured application logging."""

import logging
from contextvars import ContextVar

request_id_context: ContextVar[str] = ContextVar("request_id", default="-")


class RequestContextFilter(logging.Filter):
    """Attach the active request ID to every application log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


def configure_logging(log_level: str) -> None:
    """Configure concise console logging without logging request secrets."""
    handler = logging.StreamHandler()
    handler.addFilter(RequestContextFilter())
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s request_id=%(request_id)s %(message)s"
        )
    )
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level.upper())
