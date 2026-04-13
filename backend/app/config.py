import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://diary_user:diary_pass@localhost:5432/employee_diary",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:4200").split(",")
    WEBHOOK_TIMEOUT = 10
    WEBHOOK_MAX_RETRIES = 3
    MISSED_ENTRY_CHECK_HOUR = 10


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = (
        "postgresql://diary_user:diary_pass@localhost:5432/employee_diary_test"
    )
