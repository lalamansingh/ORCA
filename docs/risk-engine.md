# ORCA deterministic marine risk engine

## Purpose and safety boundary

ORCA Risk v1 (`orca-risk-v1`) calculates **general marine operational risk** from normalized weather, marine-model, and relevant advisory inputs. It is deterministic: the same `MarineRiskInput`, configuration, and calculation timestamp produce the same assessment. No LLM, prompt, classifier, OpenAI service, Gemini service, or agent framework participates in scoring or explanation.

The output is prototype decision support. It is not fishing permission, navigational certification, an official safety clearance, or a guarantee for a particular vessel. Vessel length, hull, loading, propulsion, crew, route exposure, and local operating limits are not modeled yet.

> **Prototype thresholds — require validation for vessel type and local authority guidance.**

## Architecture

```text
Selected location + requested time
        │
        ├── WeatherService (normalized Step 6 data)
        ├── MarineWeatherService (normalized Step 6 data)
        └── AlertService + PostGIS relevance (Step 7 advisories)
                        │
                 RiskInputBuilder
                        │
                 MarineRiskInput
                        │
              MarineRiskEngine (pure)
                        │
              MarineRiskAssessment
                        │
       API → dashboard / map / analytics timeline
```

`RiskInputBuilder` performs data collection, temporal selection, unit-preserving field extraction, spatial/temporal advisory filtering, evidence construction, freshness classification, and provenance labeling. `MarineRiskEngine` accepts only the normalized input and performs no HTTP or database calls.

## Normalized inputs

Core inputs:

- `wave_height_m`
- `wind_speed_kmh`

Supporting inputs:

- wave period and swell height/period
- wind gust
- visibility in kilometres
- precipitation in millimetres for the provider's hourly interval
- WMO weather code
- ocean-current speed in metres/second
- spatially and temporally relevant active/upcoming alerts
- observation, retrieval, source, availability, freshness, and provenance metadata

Missing measurements remain `None`. They are never converted to zero.

## Threshold configuration

All values live in the validated Python configuration object in `app/risk/config.py`. Startup constructs the config and engine, checks threshold ordering, risk-level boundaries, category coverage/caps, alert mappings, freshness order, version presence, and scoring boundaries. Invalid configuration fails fast.

### Environmental bands and raw points

| Factor | Moderate | High | Extreme | Raw points (M/H/E) | Status |
|---|---:|---:|---:|---:|---|
| Wave height | ≥1.25 m | ≥2.5 m | ≥4.0 m | 25 / 50 / 75 | Prototype operational mapping; wave values align with common descriptive sea-state boundaries, not universal vessel limits |
| Swell height | ≥1.25 m | ≥2.5 m | ≥4.0 m | 15 / 35 / 60 | Prototype |
| Sustained wind | ≥31 km/h | ≥52 km/h | ≥63 km/h | 25 / 50 / 75 | Anchored to approximate Beaufort 5, 7, and 8 lower bounds; risk points are ORCA prototype values |
| Wind gust | ≥40 km/h | ≥63 km/h | ≥85 km/h | 15 / 35 / 60 | Prototype |
| Visibility | ≤10 km | ≤4 km | ≤1 km | 15 / 35 / 55 | Descriptive bands align with Met Office good/moderate/poor/very-poor visibility boundaries; risk points are prototype |
| Precipitation | ≥2.5 mm | ≥7.5 mm | ≥15 mm | 5 / 12 / 20 | Prototype; deliberately smaller than major sea/wind hazards |
| Ocean current | ≥0.5 m/s | ≥1.0 m/s | ≥1.5 m/s | 10 / 20 / 35 | Prototype; not a vessel-independent safe-current standard |

Swell at or above 12 seconds receives a 3-point prototype bonus after its height band is crossed. Forecast WMO thunderstorm codes 95, 96, and 99 contribute 18 raw points and are explicitly described as **forecast thunderstorm risk**, never as a confirmed lightning observation.

Public reference points reviewed for v1:

- [Met Office Beaufort wind force scale](https://weather.metoffice.gov.uk/guides/coast-and-sea/beaufort-scale)
- [Met Office forecast visibility definitions](https://weather.metoffice.gov.uk/guides/what-does-this-forecast-mean)
- [WMO marine-services FAQ on sea state and wave height](https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/marine-services/frequently-asked-questions)
- [WMO Manual on Marine Meteorological Services](https://etrp.wmo.int/pluginfile.php/42200/course/section/2977/WMO-No.558_en.pdf)

These references provide descriptive meteorological/marine categories. They do not establish universal vessel-independent go/no-go thresholds; ORCA's point mapping still requires calibration and authority review.

## Exact scoring model

1. Each available input is classified into a configured band and assigned raw points.
2. Correlated factors are grouped:
   - `SEA_STATE`: wave + swell
   - `WIND`: sustained wind + gust
   - `VISIBILITY_WEATHER`: visibility + precipitation + forecast thunderstorm
   - `OCEAN_CURRENT`
   - `OFFICIAL_ALERTS`: provider and demo advisories that passed relevance checks
3. Inside each group, keep the strongest factor at full value and count each additional correlated factor at 25%. Apply the group cap.

```text
group = min(category_cap, strongest + round(0.25 × each additional raw score))
```

Category caps are 75, 75, 55, 35, and 95 respectively in the order above.

4. Combine groups in that fixed order using diminishing returns rather than naive addition:

```text
combined₀ = 0
combinedₙ = round(100 × (1 - (1 - combinedₙ₋₁/100) × (1 - groupₙ/100)))
```

5. The marginal change from each group is allocated back to its factors proportionally. The returned factor contributions therefore sum exactly to the pre-override score.
6. Apply the strongest configured relevant-alert minimum/critical override. Any added floor points are attached to that alert factor, so all displayed contributions still sum to the final score.
7. Clamp the score to `0..100`.

## Risk levels

| Score | Level |
|---:|---|
| 0–24 | `LOW` |
| 25–49 | `MODERATE` |
| 50–74 | `HIGH` |
| 75–100 | `EXTREME` |
| no responsible score | `UNAVAILABLE` with `score: null` |

## Advisory scoring and overrides

Only alerts that are valid at the assessment time and spatially relevant to the selected location may influence scoring. PostGIS containment/distance is preferred. A provider-supplied centre and radius can support deterministic distance checks for non-cyclone alerts; cyclone proximity is not inferred without usable provider geometry/proximity evidence. Text-only nationwide alerts are preserved for display but excluded from risk scoring when relevance cannot be established.

| Alert severity | Raw points | General minimum |
|---|---:|---:|
| INFO | 5 | 0 |
| WATCH | 25 | 25 |
| WARNING | 50 | 40 |
| SEVERE | 70 | 50 (`HIGH`) |
| CRITICAL | 90 | 75 (`EXTREME`) |

Hazard-specific minimums:

- High waves: WARNING 50, SEVERE 65, CRITICAL 80
- Cyclone: WARNING 50, SEVERE 75, CRITICAL 90
- Storm surge: WARNING 50, SEVERE 70, CRITICAL 90
- Tsunami: WARNING 75, SEVERE 85, CRITICAL 95

Alert factors retain alert ID, type, severity, provider, source, source URL, issued/retrieved time, and relevance metadata. The UI provides `View Alert` links. Forecast weather and an official alert remain separate evidence; group discounting and diminishing-return aggregation prevent unchecked stacking.

## Time policy

- A null `assessment_time` selects current/latest normalized observations.
- A timezone-aware future timestamp selects the closest hourly weather and marine points.
- The match tolerance is 90 minutes.
- Past requests beyond a five-minute clock tolerance are rejected.
- The forecast horizon is 48 hours.
- A future risk request never substitutes current observations when a matching future point is unavailable.

The analytics timeline fetches each forecast and the alert set once, then evaluates locally at three-hour intervals. It does not issue one provider request per chart point.

## Minimum data and data quality

Wave height and sustained wind are required for a normal scored assessment.

- If either is missing, stale beyond policy, or unmatched, return `UNAVAILABLE` and `score: null`.
- A spatially relevant alert with a configured floor of at least 50 may still produce `HIGH`/`EXTREME` when a required forecast is missing; quality becomes `POOR` and the missing inputs remain visible.
- Missing optional factors never receive zero-risk credit.
- An alert-provider outage does not lower environmental risk; it limits data quality.

Freshness boundaries use retrieval/observation ages: current ≤3 h, recent ≤6 h, stale ≤12 h, and unavailable beyond 12 h. Future points use provider retrieval age plus forecast-match tolerance rather than treating future observation time as stale.

Quality is deterministic:

- `EXCELLENT`: both core and all five supporting measurements present, weather/marine/alerts current, and at least one configured alert source successfully checked.
- `GOOD`: core present, at least five of seven scored measurements present, and alerts checked.
- `LIMITED`: core present but optional coverage, freshness, or alert availability is reduced.
- `POOR`: required forecast data is missing/stale but a strong relevant alert still supports a scored escalation.
- `INSUFFICIENT`: required data is missing/stale and no strong alert supports a responsible score.

Staleness only lowers quality; it never lowers hazard points.

## Deterministic explanations

Recommendations and summaries are fixed templates selected by `RiskLevel`. Factors are sorted by actual marginal contribution, then severity and stable identifiers. No hidden reasoning or generated text is returned. Evidence points preserve normalized values, units, provider, URL, observation time, retrieval time, and freshness.

## Demo and mixed-data policy

- `LIVE`: no demo input influenced the assessment.
- `DEMO`: only demo inputs influenced it.
- `MIXED`: live/provider data and at least one demo alert were combined; the UI labels it `MIXED · DEMO-INFLUENCED`.
- `UNAVAILABLE`: no usable provenance exists.

Demo alerts only load when `ORCA_DEMO_MODE=true`. They retain `DEMO` attribution and can exercise deterministic escalation, but are never described as official.
The bundled Chennai fixture is deliberately `CRITICAL` so the full `EXTREME` override, alert link, and mixed-provenance UI can be tested without impersonating a live authority bulletin.

## API

- `POST /api/v1/risk/evaluate` — authenticated, CSRF-protected evaluation; accepts latitude, longitude, nullable timezone-aware assessment time, refresh, and explicit `persist` flag.
- `GET /api/v1/risk` — non-persisting quick evaluation using the same service and engine.
- `GET /api/v1/risk/timeline` — 1–48 hour deterministic timeline with configurable 1–12 hour interval.
- `GET /api/v1/risk/history` — owner-scoped records that were explicitly persisted.

The service collects weather, marine, and alerts concurrently. Provider failures are converted into missing-input/quality behavior rather than false LOW results.

## Persistence and privacy

`risk_assessment_records` stores only explicitly persisted authenticated assessments: owner ID, coordinate, assessment time, score/level/version, quality/provenance, normalized factors/evidence, and creation time. It does not store raw provider payloads. Normal dashboard refreshes, quick GETs, map assessments, and timeline points use `persist=false`; ORCA does not silently create continuous location or assessment history.

## Calibration roadmap

Before production maritime use:

1. Validate bands and alert mappings with IMD/INCOIS and relevant maritime authorities.
2. Add vessel profiles and activity-specific operating limits without weakening official-alert floors.
3. Back-test against archived forecasts, advisories, observations, and incident data.
4. Version every calibrated model; never rewrite historical model meaning.
5. Establish change review, golden-scenario approval, monitoring, and rollback procedures.
