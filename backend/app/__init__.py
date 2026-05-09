from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app(config_object="app.config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes import cars_bp, recommend_bp

    app.register_blueprint(cars_bp, url_prefix="/api")
    app.register_blueprint(recommend_bp, url_prefix="/api")

    return app
