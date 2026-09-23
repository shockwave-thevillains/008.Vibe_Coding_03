#!/usr/bin/env python3
"""
Memanggang data paleogeografi untuk globe di beranda.

Sumber data (CC BY 3.0 lewat repo GPlates/pygplates-tutorials; model asli
Müller et al. 2019, EarthByte — diperlakukan sebagai CC BY-SA 4.0 agar aman):
  - Global_250-0Ma_Rotations_2019_v2.rot
  - Global_coastlines_2019_v1_low_res.shp (+ .dbf .shx .prj)
  https://github.com/GPlates/pygplates-tutorials/tree/master/data/Muller_etal_2019_PlateMotionModel_v2.0_Tectonics

Keluaran: src/data/globe/paleo.json
  {
    "n": <jumlah titik grid Fibonacci>,
    "states": [
      { "ma": 230, "land": "<bitset base64>", "coast": [[lon,lat,lon,lat,...], ...] },
      ...
    ]
  }
Koordinat garis pantai dikuantisasi 0.1° (bilangan bulat = derajat × 10).

Pemakaian:
  pip install pygplates shapely
  python3 scripts/globe/bake.py [--data DIR]
"""
from __future__ import annotations

import argparse
import base64
import json
import math
import os
import sys
import urllib.request

import numpy as np
import pygplates
import shapely
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

RAW = (
    "https://raw.githubusercontent.com/GPlates/pygplates-tutorials/master/data/"
    "Muller_etal_2019_PlateMotionModel_v2.0_Tectonics/"
)
FILES = {
    "rot": "Global_250-0Ma_Rotations_2019_v2.rot",
    "shp": "StaticGeometries/Coastlines/Global_coastlines_2019_v1_low_res.shp",
    "dbf": "StaticGeometries/Coastlines/Global_coastlines_2019_v1_low_res.dbf",
    "shx": "StaticGeometries/Coastlines/Global_coastlines_2019_v1_low_res.shx",
    "prj": "StaticGeometries/Coastlines/Global_coastlines_2019_v1_low_res.prj",
}
# Keadaan globe (juta tahun lalu). Harus sinkron dengan globeStateBySlug di src/lib/eras.ts.
TIMES = [230, 170, 100, 50, 15, 0]
N_POINTS = 14000
SIMPLIFY_DEG = 0.35
MIN_RING_DEG = 1.2  # buang pulau/ring yang sangat kecil (panjang keliling, derajat)


def fetch(data_dir: str) -> dict[str, str]:
    paths = {}
    for key, rel in FILES.items():
        dest = os.path.join(data_dir, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            print("download", rel, file=sys.stderr)
            urllib.request.urlretrieve(RAW + rel, dest)
        paths[key] = dest
    return paths


def fibonacci_lonlat(n: int) -> tuple[np.ndarray, np.ndarray]:
    i = np.arange(n) + 0.5
    lat = np.degrees(np.arcsin(1 - 2 * i / n))
    golden = math.pi * (3 - math.sqrt(5))
    lon = np.degrees((golden * np.arange(n)) % (2 * math.pi)) - 180.0
    return lon, lat


def reconstructed_polygons(features, model, time: float):
    out = []
    reconstructed = []
    pygplates.reconstruct(features, model, reconstructed, time)
    wrapper = pygplates.DateLineWrapper()
    for rf in reconstructed:
        geom = rf.get_reconstructed_geometry()
        if not isinstance(geom, pygplates.PolygonOnSphere):
            continue
        for wrapped in wrapper.wrap(geom):
            pts = [(p.get_longitude(), p.get_latitude()) for p in wrapped.get_exterior_points()]
            if len(pts) >= 3:
                poly = Polygon(pts)
                if not poly.is_valid:
                    poly = poly.buffer(0)
                if not poly.is_empty:
                    out.append(poly)
    return out


def coast_lines(polys) -> list[list[int]]:
    lines = []
    # "closing" morfologis: menyatukan kepingan poligon yang bersebelahan agar garis
    # pantai tidak dipenuhi batas-batas internal.
    merged = unary_union([p.buffer(0.3) for p in polys]).buffer(-0.3)
    geoms = getattr(merged, "geoms", [merged])
    for g in geoms:
        rings = [g.exterior] if hasattr(g, "exterior") else []
        for ring in rings:
            if ring.length < MIN_RING_DEG:
                continue
            simp = LineString(ring.coords).simplify(SIMPLIFY_DEG, preserve_topology=False)
            coords = list(simp.coords)
            # potong segmen buatan di sepanjang garis tanggal ±180°
            seg: list[tuple[float, float]] = []
            for a in coords:
                if seg:
                    b = seg[-1]
                    if abs(abs(a[0]) - 180) < 1e-6 and abs(abs(b[0]) - 180) < 1e-6:
                        if len(seg) > 1:
                            lines.append(seg)
                        seg = [a]
                        continue
                seg.append(a)
            if len(seg) > 1:
                lines.append(seg)
    out = []
    for seg in lines:
        flat = []
        for lon, lat in seg:
            flat += [round(lon * 10), round(lat * 10)]
        out.append(flat)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(os.path.dirname(__file__), ".cache"))
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "../../src/data/globe/paleo.json"))
    args = ap.parse_args()

    paths = fetch(args.data)
    model = pygplates.RotationModel(paths["rot"])
    features = pygplates.FeatureCollection(paths["shp"])
    lon, lat = fibonacci_lonlat(N_POINTS)

    states = []
    for t in TIMES:
        polys = reconstructed_polygons(features, model, float(t))
        land_geom = unary_union(polys)
        shapely.prepare(land_geom)
        mask = shapely.contains_xy(land_geom, lon, lat)
        bits = np.packbits(mask.astype(np.uint8), bitorder="little")
        coast = coast_lines(polys)
        print(f"{t:>4} Ma: {len(polys)} poligon, darat {mask.mean():.1%}, {len(coast)} garis pantai", file=sys.stderr)
        states.append({"ma": t, "land": base64.b64encode(bits.tobytes()).decode(), "coast": coast})

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(
            {
                "source": "Müller et al. (2019) plate model via GPlates/pygplates-tutorials; reconstructed with pygplates",
                "license": "CC BY-SA 4.0 (derived data)",
                "n": N_POINTS,
                "states": states,
            },
            f,
            separators=(",", ":"),
        )
    print("tulis", os.path.relpath(args.out), f"{os.path.getsize(args.out)/1024:.0f} KiB", file=sys.stderr)


if __name__ == "__main__":
    main()
