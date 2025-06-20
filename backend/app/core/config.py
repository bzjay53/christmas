"""
Configuration settings for Christmas Trading MVP
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os

class Settings(BaseSettings):
    """
    Application settings
    """
    
    # Application
    DEBUG: bool = Field(default=False)
    LOG_LEVEL: str = Field(default="INFO")
    ENVIRONMENT: str = Field(default="production")
    SECRET_KEY: str = Field(..., description="Secret key for JWT")
    
    # Database
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_KEY: str = Field(..., description="Supabase anon key")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase service key")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379")
    REDIS_PASSWORD: str = Field(default="")
    
    # KIS API
    KIS_APP_KEY: str = Field(..., description="KIS API app key")
    KIS_APP_SECRET: str = Field(..., description="KIS API app secret")
    KIS_ACCESS_TOKEN: str = Field(default="")
    KIS_BASE_URL: str = Field(default="https://openapivts.koreainvestment.com:29443")
    KIS_ACCOUNT_NUMBER: str = Field(..., description="KIS account number")
    KIS_ACCOUNT_CODE: str = Field(default="01", description="KIS account product code")
    
    # OpenAI
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4-turbo-preview")
    
    # Perplexity AI
    PERPLEXITY_API_KEY: str = Field(..., description="Perplexity API key")
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(..., description="Telegram bot token")
    TELEGRAM_CHAT_ID: str = Field(..., description="Telegram chat ID")
    TELEGRAM_WEBHOOK_URL: str = Field(default="")
    
    # Security
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default=["*"])
    
    # Trading Configuration
    DEFAULT_STOP_LOSS: float = Field(default=-0.02)
    DEFAULT_TAKE_PROFIT: float = Field(default=0.05)
    MAX_DAILY_TRADES: int = Field(default=20)
    QUEUE_DELAY_SECONDS: int = Field(default=10)
    
    # AI Configuration
    AI_CONFIDENCE_THRESHOLD: float = Field(default=0.7)
    LEARNING_UPDATE_FREQUENCY: str = Field(default="weekly")
    BACKTEST_PERIOD_DAYS: int = Field(default=30)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields to be ignored

# Create settings instance
settings = Settings()