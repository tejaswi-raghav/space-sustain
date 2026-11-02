"""Small, dependency-free k-nearest-neighbor anomaly model for demo satellite signals.

The CSV is synthetic. Replace it with observations extracted from georeferenced imagery
before using this model on real supplier or facility claims.
"""
import csv
import json
import math
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / 'data' / 'demo_signals.csv'
FEATURES = ('ndvi', 'warehouse_heat_delta_c', 'offset_canopy_change')
LABELS = ('sourcing vegetation', 'warehouse surface heat', 'offset canopy change')
K = 3


def mean(xs):
    return sum(xs) / len(xs)


def std(xs):
    center = mean(xs)
    return max(math.sqrt(sum((x - center) ** 2 for x in xs) / len(xs)), 1e-9)


def distance(a, b):
    return math.sqrt(sum((x-y)**2 for x, y in zip(a, b)))


def knn_distance(point, references, k=K):
    return mean(sorted(distance(point, row) for row in references)[:k])


def percentile(xs, p):
    ordered = sorted(xs)
    index = (len(ordered)-1)*p
    low = math.floor(index)
    high = math.ceil(index)
    return ordered[low]*(high-index) + ordered[high]*(index-low) if low != high else ordered[low]


def analyze(path=DATA):
    with open(path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    training = [r for r in rows if r['kind'] == 'train']
    scenarios = [r for r in rows if r['kind'] == 'scenario']
    if len(training) < K+2 or not scenarios:
        raise ValueError('Need at least five training rows and one scenario row')
    centers = [mean([float(r[key]) for r in training]) for key in FEATURES]
    scales = [std([float(r[key]) for r in training]) for key in FEATURES]
    def vector(row):
        return [(float(row[key])-centers[i])/scales[i] for i,key in enumerate(FEATURES)]
    reference = [vector(row) for row in training]
    leave_one_out = [knn_distance(point, reference[:i]+reference[i+1:]) for i,point in enumerate(reference)]
    threshold = percentile(leave_one_out, .95)
    results = []
    for row in scenarios:
        point = vector(row)
        nearest = min(reference, key=lambda candidate: distance(point,candidate))
        contributions = [(point[i]-nearest[i])**2 for i in range(len(FEATURES))]
        anomaly_score = knn_distance(point, reference)
        results.append({
            'scenario': row['name'],
            'anomaly': anomaly_score > threshold,
            'anomaly_score': round(anomaly_score, 2),
            'threshold': round(threshold, 2),
            'dominant_signal': LABELS[contributions.index(max(contributions))],
        })
    return {'model': 'standardized k-nearest-neighbor distance', 'training_records': len(training), 'synthetic_data': True, 'results': results}


if __name__ == '__main__':
    print(json.dumps(analyze(), indent=2))
