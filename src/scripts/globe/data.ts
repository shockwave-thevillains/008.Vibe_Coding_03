/** Data globe: dekode bitset daratan + garis pantai hasil scripts/globe/bake.py. */
export interface GlobeRaw {
  n: number;
  states: { ma: number; land: string; coast: number[][] }[];
}

export interface GlobeState {
  ma: number;
  land: Uint8Array; // 0/1 per titik grid
  coast: Float32Array; // pasangan titik segmen garis (xyz), siap LineSegments
}

export const DEG = Math.PI / 180;

/** lon/lat (derajat) → xyz di bola jari-jari r. Konvensi: +y utara, lon 0 menghadap +x. */
export function lonLatToXYZ(lon: number, lat: number, r = 1, out: number[] = [], o = 0): number[] {
  const la = lat * DEG;
  const lo = lon * DEG;
  out[o] = r * Math.cos(la) * Math.cos(lo);
  out[o + 1] = r * Math.sin(la);
  out[o + 2] = -r * Math.cos(la) * Math.sin(lo);
  return out;
}

/** Titik grid Fibonacci — urutan HARUS sama dengan bake.py. */
export function fibonacciPositions(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const tmp: number[] = [];
  for (let i = 0; i < n; i++) {
    const lat = Math.asin(1 - (2 * (i + 0.5)) / n) / DEG;
    const lon = (((golden * i) % (2 * Math.PI)) / DEG) - 180;
    lonLatToXYZ(lon, lat, 1, tmp, 0);
    pos[i * 3] = tmp[0];
    pos[i * 3 + 1] = tmp[1];
    pos[i * 3 + 2] = tmp[2];
  }
  return pos;
}

function decodeBits(b64: string, n: number): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  return out;
}

function coastSegments(lines: number[][], r: number): Float32Array {
  let count = 0;
  for (const l of lines) count += Math.max(0, l.length / 2 - 1);
  const arr = new Float32Array(count * 6);
  const a: number[] = [];
  const b: number[] = [];
  let o = 0;
  for (const l of lines) {
    for (let i = 0; i + 3 < l.length; i += 2) {
      lonLatToXYZ(l[i] / 10, l[i + 1] / 10, r, a, 0);
      lonLatToXYZ(l[i + 2] / 10, l[i + 3] / 10, r, b, 0);
      arr[o++] = a[0]; arr[o++] = a[1]; arr[o++] = a[2];
      arr[o++] = b[0]; arr[o++] = b[1]; arr[o++] = b[2];
    }
  }
  return arr;
}

export function decodeGlobe(raw: GlobeRaw): { n: number; states: GlobeState[] } {
  return {
    n: raw.n,
    states: raw.states.map((s) => ({
      ma: s.ma,
      land: decodeBits(s.land, raw.n),
      coast: coastSegments(s.coast, 1.003),
    })),
  };
}

/**
 * Kota besar (lon, lat) untuk lampu kota di Era Digital & AI. Koordinat pembulatan
 * dari pengetahuan umum geografi; hanya dipakai sebagai titik cahaya dekoratif.
 */
export const CITIES: [number, number][] = [
  [106.8, -6.2], [112.75, -7.25], [98.67, 3.59], [119.42, -5.14], [110.37, -7.8], // Jakarta, Surabaya, Medan, Makassar, Yogyakarta
  [103.82, 1.35], [100.5, 13.75], [101.69, 3.14], [120.98, 14.6], [106.63, 10.82],
  [116.4, 39.9], [121.47, 31.23], [114.17, 22.32], [139.69, 35.69], [126.98, 37.57],
  [77.21, 28.61], [72.88, 19.08], [88.36, 22.57], [77.59, 12.97], [67.0, 24.86],
  [55.27, 25.2], [51.39, 35.69], [46.68, 24.71], [31.24, 30.04], [28.98, 41.01],
  [3.38, 6.52], [36.82, -1.29], [28.05, -26.2], [18.42, -33.92], [-7.59, 33.57],
  [-0.13, 51.51], [2.35, 48.86], [13.4, 52.52], [12.5, 41.9], [-3.7, 40.42], [37.62, 55.76],
  [-74.0, 40.71], [-87.63, 41.88], [-118.24, 34.05], [-122.42, 37.77], [-79.38, 43.65], [-99.13, 19.43],
  [-46.63, -23.55], [-58.38, -34.6], [-77.04, -12.05], [-74.07, 4.71],
  [151.21, -33.87], [144.96, -37.81], [174.76, -36.85],
];

/** Pasangan indeks CITIES untuk busur koneksi antarbenua. */
export const ARCS: [number, number][] = [
  [0, 5], [0, 13], [0, 46], [5, 15], [5, 11], [13, 38], [11, 36], [30, 36], [30, 15], [30, 20],
  [31, 26], [36, 42], [42, 29], [15, 20], [20, 23], [27, 42], [46, 13], [39, 13], [37, 30], [10, 38],
  [0, 21], [16, 30], [44, 36], [6, 11],
];
