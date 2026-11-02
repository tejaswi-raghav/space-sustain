# SpaceSustain

**Proof from above. Trust below.**  [Live private preview](https://spacesustain-wsw-2026.f20240173.chatgpt.site) · [GitHub repository](https://github.com/tejaswi-raghav/space-sustain)

A Supernova WSW 2026 open innovation prototype in AI, Earth observation, and e-commerce.

SpaceSustain addresses a real shopping problem: sustainability claims are difficult to check across raw-material sources, fulfillment facilities, and carbon offset projects. The prototype pairs a fictional storefront with an explainable **Green Trust Score** and a satellite imagery map. Shoppers can inspect each product, rotate a 3D concept model, and review the signal behind the claim.

> **Prototype integrity:** Orbital Goods, its products, location markers, signal values, and scores are fictional examples. The map can load real NASA MODIS Terra imagery for 2024-09-01, but the score is not computed from that imagery. This is not a sustainability certification, carbon calculation, or audit of any real company.

## Demo features

- Responsive, space-themed landing page and product marketplace with category filters.
- Expanded product views with rotatable browser 3D models and downloadable original `.obj` concept assets.
- Interactive evidence map with an OpenStreetMap basemap and optional NASA GIBS MODIS Terra true-color overlay. Example sourcing, warehouse, and forest markers are visibly identified as illustrative.
- Explainable score dashboard with three scenario controls: forest loss, warehouse heat spike, and stalled offset growth.
- Clear methodology and limitations shown in the interface.

## Run locally

The site is buildless HTML, CSS, and JavaScript. Python 3 is sufficient:

```bash
cd spacesustain
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. The page shell and scoring work locally. Fonts, Leaflet map tiles, NASA imagery, and the Three.js 3D enhancement require network access. Downloadable `.obj` files are local. If the Three.js CDN is unavailable, the product viewer displays an accessible fallback illustration.

## Project structure

```text
dist/
  index.html        Landing page, storefront, dashboard, detail dialog
  styles.css        Responsive visual design
  app.js            Product catalog, 3D scenes, map, scoring interactions
  data/anomaly_results.json  Generated model output displayed in dashboard
  models/*.obj      Downloadable original low-poly 3D concept models
scripts/
  generate_models.py  Rebuilds the OBJ files
  anomaly_model.py   Trains and evaluates a small k-nearest-neighbor detector
data/demo_signals.csv  Explicitly synthetic training and scenario observations
.openai/hosting.json   Private Sites deployment configuration
```

## Green Trust Score

The demo scores three *observable signal categories* on a 0–100 scale:

| Signal | Weight | Intended production input |
| --- | ---: | --- |
| Sourcing vegetation | 40% | Cloud-masked Sentinel-2 / Landsat NDVI and forest-cover time series within supplier polygons |
| Warehouse heat | 25% | Landsat Collection 2 surface temperature, roof reflectance, nearby controls, seasonal baselines |
| Offset forest growth | 35% | Optical and Sentinel-1 radar forest-change time series with field validation |

`score = round(0.40 × sourcing + 0.25 × warehouse + 0.35 × offset)`

The storefront score inputs are hard-coded demonstration values in `dist/app.js`; its scenario buttons change one input at a time. The site displays precomputed alerts from a working, dependency-free **k-nearest-neighbor anomaly detector**. It trains on the synthetic vectors in `data/demo_signals.csv`, standardizes each signal, learns a threshold from leave-one-out distances, and identifies the dominant signal for each scenario. Run it with:

```bash
python3 scripts/anomaly_model.py
```

The model correctly leaves the baseline unflagged and flags the forest, heat, and offset scenarios. **It is not trained on real satellite observations; its alerts are connected to the site, but they do not determine the storefront score.** A production model should retain image dates, cloud masks, sensor metadata, comparison areas, confidence intervals, and human review decisions.

## Path to a real data prototype

1. Ingest user-consented supplier polygons, warehouse coordinates, and offset-project boundaries. Record their provenance and time period.
2. Query Sentinel-2 surface reflectance for vegetation indices and Landsat surface temperature for facilities; use Sentinel-1 radar for cloud-prone forest monitoring.
3. Compare each site against a suitable control area and multi-season baseline. Exclude cloud and missing-data periods.
4. Detect changes, calculate uncertainty, and attach image IDs and timestamps to every finding.
5. Require documents for chain of custody, energy use, life-cycle emissions, and offset additionality. Satellite observations alone cannot establish those claims.
6. Publish a product-facing explanation and allow disputes and corrections.

## Data and documentation

- [NASA GIBS API: interactive map tile access](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) — used for the dated MODIS Terra **true-color context layer**, not score inputs.
- [USGS Landsat Collection 2 surface temperature](https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature) — proposed warehouse heat input.
- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/) — proposed Sentinel-1/2 source.

**Limitations:** MODIS true-color imagery is too coarse to verify individual warehouse roof efficiency. Surface temperature is not direct energy consumption. NDVI is not proof of legal sourcing, and forest growth does not itself prove carbon removals or offset additionality. Production scores need ground data, audit trails, calibration, and independent review.

## Hackathon submission fit

This repository is a fully functional interactive **data prototype** with a tangible user-facing workflow. The included OBJ files provide additional detailed 3D product concepts. The next milestone is replacing scenario values with an authenticated, reproducible satellite pipeline.

## License

MIT. See `LICENSE`.
