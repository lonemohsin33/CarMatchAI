from flask import Blueprint, jsonify, request

from app.models import Car

bp = Blueprint("cars", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "service": "CarMarch AI API"})


@bp.get("/cars")
def list_cars():
    q = Car.query.order_by(Car.brand, Car.model)
    body_type = request.args.get("body_type")
    max_price = request.args.get("max_price", type=float)
    if body_type:
        q = q.filter(Car.body_type == body_type)
    if max_price is not None:
        q = q.filter(Car.price_lakh <= max_price)
    cars = q.all()
    return jsonify({"cars": [c.to_dict() for c in cars]})


@bp.get("/cars/<int:car_id>")
def get_car(car_id: int):
    car = Car.query.get(car_id)
    if not car:
        return jsonify({"error": "Not found"}), 404
    return jsonify(car.to_dict())


@bp.post("/compare")
def compare():
    data = request.get_json(silent=True) or {}
    ids = data.get("ids") or []
    if not isinstance(ids, list) or len(ids) < 2:
        return jsonify({"error": "Provide at least two car ids in 'ids'"}), 400
    ids = [int(i) for i in ids[:6]]
    cars = Car.query.filter(Car.id.in_(ids)).all()
    by_id = {c.id: c for c in cars}
    ordered = [by_id[i] for i in ids if i in by_id]
    if len(ordered) < 2:
        return jsonify({"error": "Could not load enough cars for comparison"}), 400

    fields = [
        "brand",
        "model",
        "price_lakh",
        "mileage",
        "fuel_type",
        "transmission",
        "body_type",
        "safety_rating",
        "engine_cc",
    ]
    rows = []
    for c in ordered:
        d = c.to_dict()
        rows.append({f: d[f] for f in fields})

    # Simple textual comparison hints
    cheapest = min(ordered, key=lambda x: x.price_lakh)
    best_mileage = max(ordered, key=lambda x: x.mileage)
    safest = max(ordered, key=lambda x: x.safety_rating)

    insights = {
        "lowest_price": {"id": cheapest.id, "label": f"{cheapest.brand} {cheapest.model}"},
        "best_mileage": {"id": best_mileage.id, "label": f"{best_mileage.brand} {best_mileage.model}"},
        "highest_safety_rating": {"id": safest.id, "label": f"{safest.brand} {safest.model}"},
    }

    return jsonify({"cars": [c.to_dict() for c in ordered], "comparison": rows, "insights": insights})
