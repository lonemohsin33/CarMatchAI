"""Human-readable reasons for match scores."""
from __future__ import annotations

from typing import Any

from app.services.query_parser import ParsedQuery


def build_explanation(
    car: dict[str, Any],
    parsed: ParsedQuery,
    score: float,
    score_breakdown: dict[str, float],
) -> str:
    parts: list[str] = []

    brand_model = f"{car['brand']} {car['model']}"

    if parsed.max_price_lakh and car["price_lakh"] <= parsed.max_price_lakh:
        parts.append(
            f"priced at ₹{car['price_lakh']:.2f} lakh, within your budget of about "
            f"₹{parsed.max_price_lakh:.2f} lakh."
        )
    elif parsed.max_price_lakh and car["price_lakh"] > parsed.max_price_lakh:
        over = car["price_lakh"] - parsed.max_price_lakh
        parts.append(
            f"₹{car['price_lakh']:.2f} lakh is about ₹{over:.2f} lakh over your stated ceiling — "
            "still listed because it may fit if you stretch slightly."
        )
    else:
        parts.append(f"listed at ₹{car['price_lakh']:.2f} lakh.")

    if score_breakdown.get("mileage", 0) > 0.15:
        parts.append(
            f"Strong mileage for its class at {car['mileage']:.1f} kmpl ({car['fuel_type']})."
        )
    elif car["mileage"] >= 18:
        parts.append(f"Good fuel economy at {car['mileage']:.1f} kmpl.")

    if score_breakdown.get("safety", 0) > 0.15:
        parts.append(
            f"Safety is a highlight with a {car['safety_rating']}-star Global NCAP-style rating in our dataset."
        )

    if parsed.body_types and car["body_type"] in parsed.body_types:
        parts.append(f"Matches your {car['body_type']} preference.")

    if parsed.transmission and car["transmission"] == parsed.transmission:
        parts.append(f"{car['transmission']} transmission as requested.")

    if score_breakdown.get("value", 0) > 0.12:
        parts.append(
            "Solid value: competitive features for the segment relative to price."
        )

    parts.append(f"Overall match score: {score:.1f}/100.")

    summary = " ".join(parts)
    return f"{brand_model}: {summary}"
