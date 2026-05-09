"""Populate PostgreSQL with seed cars when the table is empty."""
from app import create_app, db
from app.models import Car
from app.seed_data import SEED_CARS


def run() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        if Car.query.first() is not None:
            return
        for row in SEED_CARS:
            db.session.add(Car(**row))
        db.session.commit()
        print(f"Seeded {len(SEED_CARS)} cars.")


if __name__ == "__main__":
    run()
