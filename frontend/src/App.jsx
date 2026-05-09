import { useCallback, useMemo, useState } from 'react'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Badge from 'react-bootstrap/Badge'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal'
import Alert from 'react-bootstrap/Alert'
import Collapse from 'react-bootstrap/Collapse'

import { buildRecommendFilters, compareCars, recommendCars } from './api'

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric']
const BODY_OPTIONS = ['SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe SUV']

const INITIAL_FILTERS = {
  min_safety_rating: '',
  max_safety_rating: '',
  min_mileage: '',
  max_mileage: '',
  min_price_lakh: '',
  max_price_lakh: '',
  min_engine_cc: '',
  max_engine_cc: '',
  fuel_types: [],
  body_types: [],
  transmission: '',
}

function appliedFiltersBadges(applied) {
  if (!applied || typeof applied !== 'object') return []
  const rows = []
  if (applied.min_safety_rating != null) {
    rows.push({ key: 'mins', label: `Safety ≥ ${applied.min_safety_rating}★` })
  }
  if (applied.max_safety_rating != null) {
    rows.push({ key: 'maxs', label: `Safety ≤ ${applied.max_safety_rating}★` })
  }
  if (applied.min_mileage != null) {
    rows.push({ key: 'minm', label: `Mileage ≥ ${applied.min_mileage} kmpl` })
  }
  if (applied.max_mileage != null) {
    rows.push({ key: 'maxm', label: `Mileage ≤ ${applied.max_mileage} kmpl` })
  }
  if (applied.min_price_lakh != null) {
    rows.push({ key: 'minp', label: `Price ≥ ₹${applied.min_price_lakh} L` })
  }
  if (applied.max_price_lakh != null) {
    rows.push({ key: 'maxp', label: `Price ≤ ₹${applied.max_price_lakh} L` })
  }
  if (applied.min_engine_cc != null) {
    rows.push({ key: 'mine', label: `Engine ≥ ${applied.min_engine_cc} cc` })
  }
  if (applied.max_engine_cc != null) {
    rows.push({ key: 'maxe', label: `Engine ≤ ${applied.max_engine_cc} cc` })
  }
  if (applied.fuel_types?.length) {
    rows.push({ key: 'fuel', label: `Fuel: ${applied.fuel_types.join(', ')}` })
  }
  if (applied.body_types?.length) {
    rows.push({ key: 'body', label: `Body: ${applied.body_types.join(', ')}` })
  }
  if (applied.transmission) {
    rows.push({ key: 'tr', label: applied.transmission })
  }
  return rows
}

const EXAMPLE_QUERIES = [
  'Need a safe SUV under 15 lakhs with good mileage',
  'Automatic petrol sedan under 12 lakh for city',
  'Family MUV with high safety rating',
  'Fuel efficient hatchback under 9 lakhs',
]

export default function App() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [shortlist, setShortlist] = useState(() => new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareData, setCompareData] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS }))
  const [appliedFilters, setAppliedFilters] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const toggleShortlist = useCallback((id) => {
    setShortlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleFuel = useCallback((fuel) => {
    setFilters((prev) => ({
      ...prev,
      fuel_types: prev.fuel_types.includes(fuel)
        ? prev.fuel_types.filter((x) => x !== fuel)
        : [...prev.fuel_types, fuel],
    }))
  }, [])

  const toggleBody = useCallback((body) => {
    setFilters((prev) => ({
      ...prev,
      body_types: prev.body_types.includes(body)
        ? prev.body_types.filter((x) => x !== body)
        : [...prev.body_types, body],
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS })
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const payloadFilters = buildRecommendFilters(filters)
      const data = await recommendCars({ query, limit: 12, filters: payloadFilters })
      setParsed(data.parsed_preferences)
      setAppliedFilters(data.applied_filters ?? {})
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err.message)
      setRecommendations([])
      setParsed(null)
      setAppliedFilters(null)
    } finally {
      setLoading(false)
    }
  }

  const openCompare = async () => {
    const ids = [...shortlist]
    if (ids.length < 2) return
    setCompareData(null)
    setCompareLoading(true)
    setCompareOpen(true)
    try {
      const data = await compareCars({ ids })
      setCompareData(data)
    } catch (err) {
      setCompareData({ error: err.message })
    } finally {
      setCompareLoading(false)
    }
  }

  const shortlistCars = useMemo(
    () => recommendations.filter((c) => shortlist.has(c.id)),
    [recommendations, shortlist],
  )

  const activeStructuredFilterKeys = useMemo(
    () => Object.keys(buildRecommendFilters(filters)),
    [filters],
  )

  return (
    <>
      <Navbar expand="lg" className="bg-dark border-bottom border-secondary" variant="dark">
        <Container>
          <Navbar.Brand href="#" className="fw-bold tracking-tight">
            <span className="text-info">CarMarch</span>{' '}
            <span className="text-white-50 fw-semibold">AI</span>
          </Navbar.Brand>
          <Navbar.Text className="ms-auto text-white-50 small d-none d-md-block">
            Natural language → ranked cars for India
          </Navbar.Text>
        </Container>
      </Navbar>

      <div className="cm-gradient text-white py-5 mb-4 shadow-sm">
        <Container>
          <Row className="align-items-center gy-4">
            <Col lg={7}>
              <h1 className="display-6 fw-bold mb-3">Find your next car in plain English</h1>
              <p className="lead mb-0 opacity-90">
                Describe budget, body style, safety, mileage — we parse your intent, score our
                catalogue, and explain every suggestion.
              </p>
            </Col>
            <Col lg={5}>
              <Card className="shadow border-0 text-dark">
                <Card.Body className="p-4">
                  <Form onSubmit={onSubmit}>
                    <Form.Label className="fw-semibold small text-secondary">
                      What are you looking for?
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='e.g. "Safe SUV under 15 lakhs with good mileage"'
                      className="mb-3"
                    />
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {EXAMPLE_QUERIES.map((q, i) => (
                        <Button
                          key={q}
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          className="rounded-pill"
                          onClick={() => setQuery(q)}
                        >
                          Sample {i + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline-dark"
                      size="sm"
                      className="mb-2 w-100"
                      onClick={() => setFiltersOpen((o) => !o)}
                      aria-expanded={filtersOpen}
                      aria-controls="search-filters-collapse"
                    >
                      {filtersOpen ? 'Hide' : 'Show'} structured filters
                      {activeStructuredFilterKeys.length > 0 ? ' (active)' : ''}
                    </Button>
                    <Collapse in={filtersOpen}>
                      <div id="search-filters-collapse" className="mb-3">
                        <div className="border rounded-3 p-3 bg-light small">
                          <Row className="g-2 mb-2">
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Min safety ★</Form.Label>
                              <Form.Select
                                size="sm"
                                value={filters.min_safety_rating}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, min_safety_rating: e.target.value }))
                                }
                              >
                                <option value="">Any</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={String(n)}>
                                    ≥ {n}
                                  </option>
                                ))}
                              </Form.Select>
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Max safety ★</Form.Label>
                              <Form.Select
                                size="sm"
                                value={filters.max_safety_rating}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, max_safety_rating: e.target.value }))
                                }
                              >
                                <option value="">Any</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={String(n)}>
                                    ≤ {n}
                                  </option>
                                ))}
                              </Form.Select>
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Min mileage (kmpl)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="e.g. 20"
                                value={filters.min_mileage}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, min_mileage: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Max mileage (kmpl)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="—"
                                value={filters.max_mileage}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, max_mileage: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Min price (₹ L)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="—"
                                value={filters.min_price_lakh}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, min_price_lakh: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Max price (₹ L)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="e.g. 15"
                                value={filters.max_price_lakh}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, max_price_lakh: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Min engine (cc)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="—"
                                value={filters.min_engine_cc}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, min_engine_cc: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Label className="mb-0 text-muted">Max engine (cc)</Form.Label>
                              <Form.Control
                                size="sm"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="—"
                                value={filters.max_engine_cc}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, max_engine_cc: e.target.value }))
                                }
                              />
                            </Col>
                            <Col xs={12}>
                              <Form.Label className="mb-0 text-muted">Transmission</Form.Label>
                              <Form.Select
                                size="sm"
                                value={filters.transmission}
                                onChange={(e) =>
                                  setFilters((f) => ({ ...f, transmission: e.target.value }))
                                }
                              >
                                <option value="">Any</option>
                                <option value="Manual">Manual</option>
                                <option value="Automatic">Automatic</option>
                              </Form.Select>
                            </Col>
                          </Row>
                          <div className="mb-2">
                            <span className="text-muted d-block mb-1">Fuel</span>
                            <div className="d-flex flex-wrap gap-2">
                              {FUEL_OPTIONS.map((fuel) => (
                                <Form.Check
                                  key={fuel}
                                  id={`fuel-${fuel}`}
                                  type="checkbox"
                                  label={fuel}
                                  checked={filters.fuel_types.includes(fuel)}
                                  onChange={() => toggleFuel(fuel)}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-muted d-block mb-1">Body type</span>
                            <div className="d-flex flex-wrap gap-2">
                              {BODY_OPTIONS.map((body) => (
                                <Form.Check
                                  key={body}
                                  id={`body-${body}`}
                                  type="checkbox"
                                  label={body}
                                  checked={filters.body_types.includes(body)}
                                  onChange={() => toggleBody(body)}
                                />
                              ))}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={resetFilters}
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </div>
                    </Collapse>

                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Matching…
                        </>
                      ) : (
                        'Get recommendations'
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="pb-5">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {parsed && (
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <h2 className="h6 text-secondary text-uppercase mb-2">Understood preferences</h2>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {parsed.max_price_lakh != null && (
                  <Badge bg="primary" pill>
                    ≤ ₹{parsed.max_price_lakh} lakh
                  </Badge>
                )}
                {parsed.min_price_lakh != null && (
                  <Badge bg="secondary" pill>
                    ≥ ₹{parsed.min_price_lakh} lakh
                  </Badge>
                )}
                {parsed.body_types?.length > 0 &&
                  parsed.body_types.map((b) => (
                    <Badge key={b} bg="success" pill>
                      {b}
                    </Badge>
                  ))}
                {parsed.fuel_types?.length > 0 &&
                  parsed.fuel_types.map((fv) => (
                    <Badge key={fv} bg="info" pill>
                      {fv}
                    </Badge>
                  ))}
                {parsed.transmission && (
                  <Badge bg="dark" pill>
                    {parsed.transmission}
                  </Badge>
                )}
                <span className="small text-muted ms-2">
                  Priorities: safety {Math.round(parsed.priorities.safety * 100)}% · mileage{' '}
                  {Math.round(parsed.priorities.mileage * 100)}% · value{' '}
                  {Math.round(parsed.priorities.value * 100)}%
                </span>
              </div>
              {appliedFilters && appliedFiltersBadges(appliedFilters).length > 0 && (
                <>
                  <hr />
                  <h3 className="h6 text-secondary text-uppercase mb-2">
                    Structured filters (hard constraints)
                  </h3>
                  <div className="d-flex flex-wrap gap-2">
                    {appliedFiltersBadges(appliedFilters).map(({ key, label }) => (
                      <Badge key={key} bg="warning" text="dark" pill>
                        {label}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="h4 mb-0">Ranked matches</h2>
          <div className="d-flex gap-2">
            <Badge bg="light" text="dark" className="border">
              {shortlist.size} shortlisted
            </Badge>
            <Button
              variant="outline-primary"
              size="sm"
              disabled={shortlist.size < 2}
              onClick={openCompare}
            >
              Compare shortlisted
            </Button>
          </div>
        </div>

        {!hasSearched && !loading && !error && (
          <p className="text-muted">Submit a query to see ranked cars with explanations.</p>
        )}
        {hasSearched && recommendations.length === 0 && !loading && !error && (
          <Alert variant="info">
            No cars match your natural-language intent plus structured filters. Try relaxing filters
            (e.g. lower min safety or mileage) or broadening your query.
          </Alert>
        )}

        <Row className="g-4">
          {recommendations.map((car) => (
            <Col key={car.id} md={6} xl={4}>
              <Card className="h-100 border-0 shadow-sm cm-card-hover transition-all">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="h5 mb-0">
                        {car.brand} {car.model}
                      </Card.Title>
                      <div className="text-muted small">{car.body_type}</div>
                    </div>
                    <Badge bg="primary" pill className="fs-6">
                      {car.score}
                    </Badge>
                  </div>
                  <div className="small mb-2">
                    <strong>₹{car.price_lakh.toFixed(2)} lakh</strong>
                    <span className="text-muted"> · </span>
                    {car.fuel_type === 'Electric'
                      ? `${car.mileage} km/kWh equiv.`
                      : `${car.mileage} kmpl`}
                    {' · '}
                    {car.fuel_type}
                    <span className="text-muted"> · </span>
                    {car.transmission}
                  </div>
                  <div className="small mb-3">
                    <Badge bg="light" text="dark" className="me-1">
                      {car.safety_rating}★ safety
                    </Badge>
                    <Badge bg="light" text="dark">
                      {car.engine_cc} cc
                    </Badge>
                  </div>
                  <Form.Check
                    type="checkbox"
                    id={`short-${car.id}`}
                    label="Shortlist"
                    checked={shortlist.has(car.id)}
                    onChange={() => toggleShortlist(car.id)}
                    className="mb-3 user-select-none"
                  />
                  <Card.Text className="small text-secondary flex-grow-1">{car.explanation}</Card.Text>
                  <details className="small">
                    <summary className="cursor-pointer text-muted">Score breakdown</summary>
                    <ul className="mt-2 mb-0 ps-3">
                      {Object.entries(car.score_breakdown || {}).map(([k, v]) => (
                        <li key={k}>
                          {k}: {v}
                        </li>
                      ))}
                    </ul>
                  </details>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <Modal show={compareOpen} onHide={() => setCompareOpen(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Compare shortlisted</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {compareLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}
          {!compareLoading && compareData?.error && (
            <Alert variant="danger">{compareData.error}</Alert>
          )}
          {!compareLoading && compareData && !compareData.error && (
            <>
              <Row className="g-2 mb-3">
                <Col md={4}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body className="small">
                      <div className="text-muted">Lowest price</div>
                      <strong>{compareData.insights?.lowest_price?.label}</strong>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body className="small">
                      <div className="text-muted">Best mileage</div>
                      <strong>{compareData.insights?.best_mileage?.label}</strong>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body className="small">
                      <div className="text-muted">Highest safety (dataset)</div>
                      <strong>{compareData.insights?.highest_safety_rating?.label}</strong>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <div className="table-responsive">
                <Table striped bordered hover size="sm" className="align-middle">
                  <thead>
                    <tr>
                      <th>Field</th>
                      {(compareData.cars || []).map((c) => (
                        <th key={c.id} className="text-nowrap">
                          {c.brand} {c.model}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      'price_lakh',
                      'mileage',
                      'fuel_type',
                      'transmission',
                      'body_type',
                      'safety_rating',
                      'engine_cc',
                    ].map((field) => (
                      <tr key={field}>
                        <td className="fw-semibold text-capitalize">{field.replace(/_/g, ' ')}</td>
                        {(compareData.cars || []).map((c) => (
                          <td key={c.id}>{c[field]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCompareOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <footer className="bg-dark text-white-50 py-4 mt-auto small">
        <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <span>© {new Date().getFullYear()} CarMarch AI · Illustrative dataset</span>
          <span>
            Shortlisted: {shortlistCars.map((c) => `${c.brand} ${c.model}`).join(' · ') || '—'}
          </span>
        </Container>
      </footer>
    </>
  )
}
