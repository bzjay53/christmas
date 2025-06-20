"""
Logging configuration for Christmas Trading MVP
"""

import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    """
    Setup structured logging with loguru
    """
    
    # Remove default logger
    logger.remove()
    
    # Ensure log level is uppercase and valid
    try:
        log_level = settings.LOG_LEVEL.upper() if hasattr(settings, 'LOG_LEVEL') else 'INFO'
    except:
        log_level = 'INFO'
    
    # Map common lowercase values
    level_mapping = {
        'info': 'INFO',
        'debug': 'DEBUG', 
        'warning': 'WARNING',
        'error': 'ERROR',
        'critical': 'CRITICAL'
    }
    
    if log_level.lower() in level_mapping:
        log_level = level_mapping[log_level.lower()]
    
    # Console logging format
    console_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    
    # Add console handler
    logger.add(
        sys.stdout,
        format=console_format,
        level=log_level,
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # Add file handler for production (with error handling)
    try:
        if not settings.DEBUG:
            logger.add(
                "logs/christmas_trading_{time:YYYY-MM-DD}.log",
                format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
                level="INFO",
                rotation="1 day",
                retention="30 days",
                compression="zip"
            )
        
        # Add error file handler
        logger.add(
            "logs/errors_{time:YYYY-MM-DD}.log",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
            level="ERROR",
            rotation="1 day",
            retention="90 days",
            compression="zip"
        )
    except (PermissionError, OSError) as e:
        # If file logging fails, log to console only
        logger.warning(f"File logging disabled due to permission error: {e}")
        pass
    
    return logger