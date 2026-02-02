import os


class Config:
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = False
    TESTING = False
