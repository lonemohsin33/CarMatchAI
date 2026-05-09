from app import db


class Car(db.Model):
    __tablename__ = "cars"

    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(80), nullable=False)
    model = db.Column(db.String(120), nullable=False)
    price_lakh = db.Column(db.Float, nullable=False)
    mileage = db.Column(db.Float, nullable=False)
    fuel_type = db.Column(db.String(40), nullable=False)
    transmission = db.Column(db.String(40), nullable=False)
    body_type = db.Column(db.String(40), nullable=False)
    safety_rating = db.Column(db.Integer, nullable=False)
    engine_cc = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "brand": self.brand,
            "model": self.model,
            "price_lakh": self.price_lakh,
            "mileage": self.mileage,
            "fuel_type": self.fuel_type,
            "transmission": self.transmission,
            "body_type": self.body_type,
            "safety_rating": self.safety_rating,
            "engine_cc": self.engine_cc,
        }
