"""
Structured logging setup for Benchmind API
"""

import logging
import sys
from typing import Dict, Any

from .config import settings


def setup_logging() -> None:
    """Configure structured logging for the application."""
    
    # Create formatter
    formatter = logging.Formatter(
        fmt=settings.log_format,
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper()))
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("benchmind").setLevel(getattr(logging, settings.log_level.upper()))


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a specific module."""
    return logging.getLogger(f"benchmind.{name}")


class LoggerMixin:
    """Mixin to add logging capabilities to classes."""
    
    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class."""
        return get_logger(self.__class__.__name__)
