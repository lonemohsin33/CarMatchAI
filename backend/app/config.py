import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-carmarch-secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://carmarch:carmarch@localhost:5432/carmarch",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
