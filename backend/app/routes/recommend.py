from flask import Blueprint, jsonify, request

from app import db
from app.services.query_parser import parse_query
from app.services import recommender as recommender_svc
from app.services.recommendation_filters import normalize_filters

bp = Blueprint("recommend", __name__)


@bp.post("/recommend")
def recommend_cars():
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    if not query:
        return jsonify({"error": "Missing 'query'"}), 400

    limit = int(data.get("limit") or 12)
    limit = max(1, min(limit, 25))

    parsed = parse_query(query)
    filters = normalize_filters(data.get("filters"))
    results = recommender_svc.recommend(parsed, db.session, limit=limit, filters=filters)

    return jsonify(
        {
            "parsed_preferences": parsed.to_dict(),
            "applied_filters": filters,
            "recommendations": results,
        }
    )
