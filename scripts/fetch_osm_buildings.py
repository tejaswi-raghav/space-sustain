"""Build a small, attributed OSM building snapshot for the Dubai twin fallback.

Uses the official OSM read API for seven deliberately small bounding boxes.
Run manually when the snapshot needs refreshing; never call this at app runtime.
"""
from __future__ import annotations
import json
import math
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

BOXES = {
    "downtown": (55.2770, 25.1895, 55.2835, 25.1950),
    "al-quoz": (55.2330, 25.1315, 55.2390, 25.1365),
    "dubai-silicon-oasis": (55.3780, 25.1210, 55.3840, 25.1270),
    "business-bay": (55.2690, 25.1825, 55.2750, 25.1875),
    "dubai-marina": (55.1400, 25.0780, 55.1460, 25.0830),
    "expo-city": (55.1480, 24.9630, 55.1540, 24.9680),
    "jebel-ali": (55.0870, 24.9820, 55.0940, 24.9880),
}
OUT = Path(__file__).resolve().parents[1] / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def area_m2(ring: list[list[float]]) -> float:
    lat = sum(point[1] for point in ring) / len(ring)
    meters_lon = 111_320 * math.cos(math.radians(lat))
    meters_lat = 110_574
    xy = [(lon * meters_lon, lat * meters_lat) for lon, lat in ring]
    return abs(sum(xy[i][0] * xy[i+1][1] - xy[i+1][0] * xy[i][1] for i in range(len(xy)-1))) / 2


def get_height(tags: dict[str, str]) -> tuple[float, str]:
    raw = tags.get("height", "")
    match = re.search(r"\d+(?:\.\d+)?", raw)
    if match:
        height = float(match.group())
        if 2 <= height <= 800:
            return round(height, 1), "osm:height"
    levels = tags.get("building:levels", "")
    match = re.search(r"\d+(?:\.\d+)?", levels)
    if match:
        height = float(match.group()) * 3.2
        if 2 <= height <= 800:
            return round(height, 1), "levels×3.2m estimate"
    return 14.0, "visual fallback estimate"


def fetch(name: str, bbox: tuple[float, ...]) -> dict:
    query = urllib.parse.urlencode({"bbox": ",".join(map(str, bbox))})
    request = urllib.request.Request(
        "https://api.openstreetmap.org/api/0.6/map?" + query,
        headers={"User-Agent": "SpaceSustain-DubaiTwin/1.0 (small educational OSM snapshot)"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
    root = ET.fromstring(raw)
    nodes = {node.attrib["id"]: [float(node.attrib["lon"]), float(node.attrib["lat"])] for node in root.findall("node")}
    features = []
    for way in root.findall("way"):
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
        if "building" not in tags or tags["building"] == "no":
            continue
        refs = [nd.attrib["ref"] for nd in way.findall("nd")]
        if len(refs) < 4 or refs[0] != refs[-1] or any(ref not in nodes for ref in refs):
            continue
        ring = [nodes[ref] for ref in refs]
        area = area_m2(ring)
        if not 16 <= area <= 150_000:
            continue
        height, source = get_height(tags)
        features.append({
            "type": "Feature",
            "id": "osm-way-" + way.attrib["id"],
            "properties": {
                "osm_id": way.attrib["id"],
                "name": tags.get("name", "Unnamed OSM building"),
                "height_m": height,
                "height_source": source,
                "footprint_area_m2": round(area),
                "district": name,
            },
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        })
    features.sort(key=lambda f: f["properties"]["footprint_area_m2"], reverse=True)
    return {
        "type": "FeatureCollection",
        "name": name,
        "source": "© OpenStreetMap contributors, ODbL 1.0",
        "source_url": "https://www.openstreetmap.org/copyright",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "bbox": bbox,
        "features": features[:180],
    }


if __name__ == "__main__":
    import sys
    selected = dict(BOXES) if len(sys.argv) == 1 else {name: BOXES[name] for name in sys.argv[1:]}
    for index, (name, bbox) in enumerate(selected.items()):
        if index:
            time.sleep(1)
        collection = fetch(name, bbox)
        destination = OUT / f"{name}-buildings.geojson"
        destination.write_text(json.dumps(collection, separators=(",", ":")))
        print(f"{name}: {len(collection['features'])} buildings, {destination.stat().st_size} bytes")
