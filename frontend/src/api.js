const apiBase = import.meta.env.VITE_API_URL ?? ''

async function postJson(path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || res.statusText || 'Request failed'
    throw new Error(msg)
  }
  return data
}

const FLOAT_KEYS = [
  'min_mileage',
  'max_mileage',
  'min_price_lakh',
  'max_price_lakh',
  'min_engine_cc',
  'max_engine_cc',
]

/**
 * Build the `filters` object for /api/recommend from form state. Omits empty fields.
 */
export function buildRecommendFilters(f) {
  if (!f) return {}
  const out = {}

  if (f.min_safety_rating !== '' && f.min_safety_rating != null) {
    const v = parseInt(String(f.min_safety_rating), 10)
    if (!Number.isNaN(v) && v >= 1 && v <= 5) out.min_safety_rating = v
  }
  if (f.max_safety_rating !== '' && f.max_safety_rating != null) {
    const v = parseInt(String(f.max_safety_rating), 10)
    if (!Number.isNaN(v) && v >= 1 && v <= 5) out.max_safety_rating = v
  }

  for (const key of FLOAT_KEYS) {
    const raw = f[key]
    if (raw === '' || raw == null) continue
    const v = parseFloat(String(raw))
    if (!Number.isNaN(v)) out[key] = v
  }

  if (f.fuel_types?.length) out.fuel_types = [...f.fuel_types]
  if (f.body_types?.length) out.body_types = [...f.body_types]
  if (f.transmission === 'Manual' || f.transmission === 'Automatic') {
    out.transmission = f.transmission
  }

  return out
}

/**
 * POST /api/recommend — natural language query → parsed prefs + ranked cars
 * @param {object} [params.filters] — from buildRecommendFilters()
 */
export async function recommendCars({ query, limit = 12, filters } = {}) {
  const body = { query, limit }
  if (filters && Object.keys(filters).length > 0) {
    body.filters = filters
  }
  return postJson('/api/recommend', body)
}

/**
 * POST /api/compare — side-by-side comparison for shortlisted ids
 */
export async function compareCars({ ids }) {
  return postJson('/api/compare', { ids })
}
