"""Optional structured filters applied before scoring (AND semantics)."""
from __future__ import annotations

from typing import Any

from app.models import Car


def normalize_filters(raw: dict | None) -> dict[str, Any]:
    """Parse JSON `filters` object; unknown keys ignored. Returns only active constraints."""
    if not raw or not isinstance(raw, dict):
        return {}

    out: dict[str, Any] = {}

    if raw.get("min_safety_rating") is not None:
        try:
            v = int(raw["min_safety_rating"])
            if 1 <= v <= 5:
                out["min_safety_rating"] = v
        except (TypeError, ValueError):
            pass

    if raw.get("max_safety_rating") is not None:
        try:
            v = int(raw["max_safety_rating"])
            if 1 <= v <= 5:
                out["max_safety_rating"] = v
        except (TypeError, ValueError):
            pass

    for key in (
        "min_mileage",
        "max_mileage",
        "min_price_lakh",
        "max_price_lakh",
        "min_engine_cc",
        "max_engine_cc",
    ):
        if raw.get(key) is None:
            continue
        try:
            v = float(raw[key])
            out[key] = v
        except (TypeError, ValueError):
            pass

    ft = raw.get("fuel_types")
    if isinstance(ft, list) and ft:
        cleaned = [str(x).strip() for x in ft if x]
        if cleaned:
            out["fuel_types"] = cleaned

    bt = raw.get("body_types")
    if isinstance(bt, list) and bt:
        cleaned = [str(x).strip() for x in bt if x]
        if cleaned:
            out["body_types"] = cleaned

    tr = raw.get("transmission")
    if isinstance(tr, str):
        t = tr.strip()
        if t in ("Manual", "Automatic"):
            out["transmission"] = t

    return out


def car_passes_filters(car: Car, f: dict[str, Any]) -> bool:
    if not f:
        return True

    if "min_safety_rating" in f and car.safety_rating < f["min_safety_rating"]:
        return False
    if "max_safety_rating" in f and car.safety_rating > f["max_safety_rating"]:
        return False

    if "min_mileage" in f and car.mileage < f["min_mileage"]:
        return False
    if "max_mileage" in f and car.mileage > f["max_mileage"]:
        return False

    if "min_price_lakh" in f and car.price_lakh < f["min_price_lakh"]:
        return False
    if "max_price_lakh" in f and car.price_lakh > f["max_price_lakh"]:
        return False

    if "min_engine_cc" in f and car.engine_cc < f["min_engine_cc"]:
        return False
    if "max_engine_cc" in f and car.engine_cc > f["max_engine_cc"]:
        return False

    if f.get("fuel_types") and car.fuel_type not in f["fuel_types"]:
        return False
    if f.get("body_types") and car.body_type not in f["body_types"]:
        return False
    if "transmission" in f and car.transmission != f["transmission"]:
        return False

    return True
