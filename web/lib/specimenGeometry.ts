import * as THREE from "three";

// Builds a single IcosahedronGeometry with seven morph targets baked in, one
// per Bristol type, so the specimen can smoothly deform from "separate hard
// lumps" through "entirely liquid" by driving mesh.morphTargetInfluences.
//
// Three.js morph target semantics (morphTargetsRelative = false, the
// default): geometry.attributes.position holds the REST shape, and each
// entry in geometry.morphAttributes.position holds an ABSOLUTE alternate
// shape. At render time the GPU adds influence[i] * (target[i] - position)
// for every active target. We set the rest shape equal to target[0] and
// include target[0] itself as morph target 0 — that makes influence[0] = 1
// a no-op (identity) and lets every Bristol type, including the first, be
// addressed the same way by index.
//
// Normals are intentionally left to flat shading (material.flatShading =
// true) rather than computed per morph target: recomputing smooth vertex
// normals for a blended, in-between shape every frame is expensive and
// unnecessary here, and faceted shading reads as "soft clay" anyway, which
// is the look we want.

interface SpecimenProfile {
  elongationX: number;
  flattenY: number;
  bumpiness: number;
  bumpFrequency: number;
  raggedness: number;
}

// One entry per Bristol type (index 0 = Type 1 "separate hard lumps" ... 6 =
// Type 7 "entirely liquid"), tuned by eye against lib/bristol.ts's labels.
const SPECIMEN_PROFILES: SpecimenProfile[] = [
  { elongationX: 1.0, flattenY: 0.92, bumpiness: 0.24, bumpFrequency: 5.5, raggedness: 0.02 },
  { elongationX: 1.55, flattenY: 0.85, bumpiness: 0.16, bumpFrequency: 4.0, raggedness: 0.02 },
  { elongationX: 1.8, flattenY: 0.8, bumpiness: 0.09, bumpFrequency: 3.2, raggedness: 0.015 },
  { elongationX: 1.9, flattenY: 0.78, bumpiness: 0.04, bumpFrequency: 2.0, raggedness: 0.0 },
  { elongationX: 1.3, flattenY: 0.7, bumpiness: 0.1, bumpFrequency: 3.0, raggedness: 0.03 },
  { elongationX: 1.1, flattenY: 0.42, bumpiness: 0.14, bumpFrequency: 4.5, raggedness: 0.09 },
  { elongationX: 1.0, flattenY: 0.14, bumpiness: 0.05, bumpFrequency: 6.0, raggedness: 0.05 },
];

// Cheap, dependency-free, deterministic 3D "noise": a handful of layered
// sine/cosine waves of the vertex position. Not true Perlin/Simplex quality,
// but for organic-looking, reproducible surface bumps on a small hero mesh
// it's indistinguishable at this scale and avoids pulling in a noise library.
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
  return (
    (Math.sin(x * 3.7 + seed) * Math.cos(y * 4.3 - seed * 1.3) +
      Math.sin(y * 2.1 - seed * 0.7) * Math.cos(z * 5.1 + seed) +
      Math.sin(z * 3.3 + seed * 2.1) * Math.cos(x * 2.7 - seed)) /
    3
  );
}

export function buildSpecimenGeometry(baseRadius = 0.55, detail = 3) {
  const geometry = new THREE.IcosahedronGeometry(baseRadius, detail);
  const baseArray = Float32Array.from(geometry.attributes.position.array);
  const vertexCount = baseArray.length / 3;

  const targets = SPECIMEN_PROFILES.map((profile, typeIndex) => {
    const out = new Float32Array(baseArray.length);
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const x0 = baseArray[idx];
      const y0 = baseArray[idx + 1];
      const z0 = baseArray[idx + 2];

      const n = pseudoNoise3D(
        x0 * profile.bumpFrequency,
        y0 * profile.bumpFrequency,
        z0 * profile.bumpFrequency,
        typeIndex * 11.3
      );
      const raggedN = pseudoNoise3D(x0 * 11, y0 * 11, z0 * 11, typeIndex * 5.9 + 3);
      const displacement = 1 + n * profile.bumpiness + raggedN * profile.raggedness;

      out[idx] = x0 * profile.elongationX * displacement;
      out[idx + 1] = y0 * profile.flattenY * displacement;
      out[idx + 2] = z0 * displacement;
    }
    return out;
  });

  // Rest shape = Bristol type 1's shape, so an all-zero influence array
  // still renders something sensible before the scroll-driven influence
  // loop runs on the first frame.
  geometry.attributes.position = new THREE.Float32BufferAttribute(targets[0], 3);
  geometry.morphAttributes.position = targets.map(
    (arr) => new THREE.Float32BufferAttribute(arr, 3)
  );
  geometry.computeBoundingSphere();

  return geometry;
}

// Piecewise-linear interpolation through a set of (stop, value) control
// points — the same technique Framer Motion's useTransform uses internally
// for a stop array, reimplemented as a plain function so it can run inside
// an R3F useFrame loop without creating a MotionValue per call.
export function piecewiseLerp(
  x: number,
  stops: readonly number[],
  values: readonly number[]
): number {
  if (x <= stops[0]) return values[0];
  const last = stops.length - 1;
  if (x >= stops[last]) return values[last];
  for (let i = 0; i < last; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (x >= a && x <= b) {
      const t = (x - a) / (b - a);
      return values[i] + (values[i + 1] - values[i]) * t;
    }
  }
  return values[last];
}

// Maps a 0..1 scroll fraction to a continuous 0..6 float across the seven
// Bristol stops, mirroring the piecewise-linear stops used elsewhere
// (lib/bristol.ts MORPH_STOPS), so the 3D morph and the legend rail agree.
export function continuousBristolIndex(progress: number, stops: readonly number[]): number {
  return piecewiseLerp(
    progress,
    stops,
    stops.map((_, i) => i)
  );
}
