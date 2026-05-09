"""
Extract structured preferences from natural-language car queries (rule-based, AI-style UX).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


# Canonical values must match `Car.body_type` in the database
_BODY_SYNONYMS: dict[str, list[str]] = {
    "SUV": ["suv", "sport utility", "compact suv", "subcompact suv"],
    "Sedan": ["sedan", "saloon"],
    "Hatchback": ["hatchback", "hatch"],
    "MUV": ["muv", "mpv", "7 seater", "seven seater", "family car"],
    "Coupe SUV": ["coupe suv", "coupe-suv"],
}


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _extract_price_lakh(text: str) -> tuple[float | None, float | None]:
    """Returns (max_price, min_price) in lakhs when inferable."""
    max_price: float | None = None
    min_price: float | None = None

    # "under 15 lakh", "below 12 lakhs", "upto 10 lakh"
    for m in re.finditer(
        r"(?:under|below|upto|up to|less than|max(?:imum)?|within)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)?",
        text,
    ):
        max_price = float(m.group(1))
    # "15 lakh budget"
    m = re.search(
        r"budget\s*(?:of|around|about)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)?",
        text,
    )
    if m:
        v = float(m.group(1))
        max_price = v if max_price is None else min(max_price, v)
    # standalone "15 lakhs" as ceiling when no other signal
    if max_price is None:
        m = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)\b", text)
        if m:
            max_price = float(m.group(1))

    # "above 10 lakh", "from 8 lakhs"
    for m in re.finditer(
        r"(?:above|over|from|at least|minimum)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)?",
        text,
    ):
        min_price = float(m.group(1))

    return max_price, min_price


def _detect_body_types(text: str) -> list[str]:
    found: list[str] = []
    for canonical, phrases in _BODY_SYNONYMS.items():
        for p in phrases:
            if p in text:
                if canonical not in found:
                    found.append(canonical)
                break
    return found


def _detect_fuel(text: str) -> list[str]:
    fuels: list[str] = []
    if any(w in text for w in ["diesel", "diesal"]):
        fuels.append("Diesel")
    if any(w in text for w in ["petrol", "gasoline", "gas "]):
        fuels.append("Petrol")
    if "cng" in text:
        fuels.append("CNG")
    if "electric" in text or " ev " in f" {text} " or text.strip() == "ev":
        fuels.append("Electric")
    if "hybrid" in text:
        fuels.append("Hybrid")
    return fuels


def _detect_transmission(text: str) -> str | None:
    if any(w in text for w in ["automatic", "amt", "cvt", "dct", "torque converter"]):
        return "Automatic"
    if "manual" in text or "stick" in text:
        return "Manual"
    return None


def _priorities(text: str) -> dict[str, float]:
    p = {"safety": 0.35, "mileage": 0.35, "value": 0.3}
    if any(w in text for w in ["safe", "safety", "crash", "ncap", "star rating"]):
        p["safety"] = min(1.0, p["safety"] + 0.35)
    if any(
        w in text
        for w in ["mileage", "fuel efficient", "fuel economy", "economical", "kmpl", "range"]
    ):
        p["mileage"] = min(1.0, p["mileage"] + 0.35)
    if any(w in text for w in ["value", "best deal", "budget", "affordable", "cheap", "vfm"]):
        p["value"] = min(1.0, p["value"] + 0.25)
    s = sum(p.values())
    return {k: v / s for k, v in p.items()}


@dataclass
class ParsedQuery:
    raw: str
    max_price_lakh: float | None = None
    min_price_lakh: float | None = None
    body_types: list[str] = field(default_factory=list)
    fuel_types: list[str] = field(default_factory=list)
    transmission: str | None = None
    priorities: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "raw": self.raw,
            "max_price_lakh": self.max_price_lakh,
            "min_price_lakh": self.min_price_lakh,
            "body_types": self.body_types,
            "fuel_types": self.fuel_types,
            "transmission": self.transmission,
            "priorities": self.priorities,
        }


def parse_query(query: str) -> ParsedQuery:
    text = _normalize_text(query)
    max_p, min_p = _extract_price_lakh(text)
    bodies = _detect_body_types(text)
    fuels = _detect_fuel(text)
    trans = _detect_transmission(text)
    pri = _priorities(text)

    return ParsedQuery(
        raw=query.strip(),
        max_price_lakh=max_p,
        min_price_lakh=min_p,
        body_types=bodies,
        fuel_types=fuels,
        transmission=trans,
        priorities=pri,
    )
