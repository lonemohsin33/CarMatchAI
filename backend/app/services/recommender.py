"""Score and rank cars against parsed preferences."""
from __future__ import annotations

from typing import Any

from app.models import Car
from app.services.explanations import build_explanation
from app.services.query_parser import ParsedQuery
from app.services.recommendation_filters import car_passes_filters


def _mileage_percentile(cars: list[Car], mileage: float) -> float:
    vals = sorted(c.mileage for c in cars)
    if not vals:
        return 0.5
    below = sum(1 for v in vals if v <= mileage)
    return below / len(vals)


def _score_car(car: Car, parsed: ParsedQuery, pool: list[Car]) -> tuple[float, dict[str, float]]:
    pri = parsed.priorities
    breakdown: dict[str, float] = {"price_fit": 0.0, "safety": 0.0, "mileage": 0.0, "value": 0.0, "filters": 0.0}

    # Price fit (0-30)
    if parsed.max_price_lakh:
        if car.price_lakh <= parsed.max_price_lakh:
            ratio = car.price_lakh / max(parsed.max_price_lakh, 0.1)
            breakdown["price_fit"] = 30 * (1 - ratio * 0.4)
        else:
            over = (car.price_lakh - parsed.max_price_lakh) / max(parsed.max_price_lakh, 1)
            breakdown["price_fit"] = max(0, 15 - over * 20)
    else:
        breakdown["price_fit"] = 22

    if parsed.min_price_lakh and car.price_lakh < parsed.min_price_lakh:
        breakdown["price_fit"] *= 0.7

    # Safety (0-25) scaled by priority
    safety_norm = min(1.0, car.safety_rating / 5.0)
    breakdown["safety"] = 25 * safety_norm * (0.5 + 0.5 * pri.get("safety", 0.33))

    # Mileage (0-25)
    mile_pct = _mileage_percentile(pool, car.mileage)
    breakdown["mileage"] = 25 * mile_pct * (0.5 + 0.5 * pri.get("mileage", 0.33))

    # Value: mileage per lakh (0-20)
    v = car.mileage / max(car.price_lakh, 1.0)
    vmax = max(c.mileage / max(c.price_lakh, 1.0) for c in pool) if pool else v
    vmin = min(c.mileage / max(c.price_lakh, 1.0) for c in pool) if pool else v
    if vmax > vmin:
        vnorm = (v - vmin) / (vmax - vmin)
    else:
        vnorm = 0.5
    breakdown["value"] = 20 * vnorm * (0.5 + 0.5 * pri.get("value", 0.33))

    # Hard preference bonuses (0-15)
    if parsed.body_types and car.body_type in parsed.body_types:
        breakdown["filters"] += 8
    elif parsed.body_types:
        breakdown["filters"] += 0
    else:
        breakdown["filters"] += 4

    if parsed.fuel_types and car.fuel_type in parsed.fuel_types:
        breakdown["filters"] += 4
    if parsed.transmission and car.transmission == parsed.transmission:
        breakdown["filters"] += 3

    raw = sum(breakdown.values())
    # Cap at 100
    total = min(100.0, raw)
    return total, breakdown


def recommend(
    parsed: ParsedQuery,
    session,
    limit: int = 12,
    filters: dict | None = None,
) -> list[dict[str, Any]]:
    f = filters or {}
    all_rows: list[Car] = session.query(Car).all()
    pool: list[Car] = [c for c in all_rows if car_passes_filters(c, f)]
    if not pool:
        return []

    scored: list[tuple[Car, float, dict[str, float]]] = []
    for car in pool:
        s, b = _score_car(car, parsed, pool)
        scored.append((car, s, b))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:limit]

    out: list[dict[str, Any]] = []
    for car, score, breakdown in top:
        d = car.to_dict()
        d["score"] = round(score, 2)
        d["score_breakdown"] = {k: round(v, 2) for k, v in breakdown.items()}
        d["explanation"] = build_explanation(d, parsed, score, breakdown)
        out.append(d)
    return out
