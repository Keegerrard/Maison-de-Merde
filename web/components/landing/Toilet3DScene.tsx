"use client";

import { Component, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { BRISTOL_HEX, MORPH_STOPS } from "@/lib/bristol";
import { buildSpecimenGeometry, piecewiseLerp } from "@/lib/specimenGeometry";

const MORPH_STOPS_ARR = [...MORPH_STOPS];
const BRISTOL_COLORS = BRISTOL_HEX.map((hex) => new THREE.Color(hex));

// Lid stops mirror the original SVG hero's timing: closed -> open -> closed.
const LID_STOPS = [0, 0.06, 0.16, 0.94, 1];
const LID_DEGREES = [0, 0, -108, -108, 0];

// A squat, wide toilet-bowl silhouette (not a vase): a narrow pedestal
// waist, a bowl body that flares out much wider than it is tall, and a
// flared rim lip that curls back in to form the (lid-covered) opening.
function bowlProfile(): THREE.Vector2[] {
  const points: [number, number][] = [
    [0.6, -1.1],
    [0.55, -1.02],
    [0.3, -0.75],
    [0.32, -0.4],
    [0.55, -0.15],
    [0.8, 0.05],
    [0.92, 0.22],
    [0.9, 0.38],
    [0.8, 0.5],
    [0.78, 0.56],
    [0.85, 0.6],
    [0.7, 0.64],
  ];
  return points.map(([r, y]) => new THREE.Vector2(r, y));
}

function SceneContent({ progress }: { progress: MotionValue<number> }) {
  const rootRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const specimenRef = useRef<THREE.Mesh | null>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  const bowlGeometry = useMemo(() => new THREE.LatheGeometry(bowlProfile(), 40), []);
  const specimenGeometry = useMemo(() => buildSpecimenGeometry(0.42, 3), []);

  // R3F attaches `geometry` as a property after construction rather than
  // passing it to the THREE.Mesh constructor, so the constructor's own
  // updateMorphTargets() call never runs and morphTargetInfluences stays
  // undefined. WebGLMorphtargets.update() assumes it exists once
  // morphAttributes.position is present and throws reading its `.length`.
  // A ref callback (fires synchronously at attach, ahead of any render-loop
  // tick) is used instead of useEffect, which can race the first frame.
  const setSpecimenRef = (node: THREE.Mesh | null) => {
    specimenRef.current = node;
    node?.updateMorphTargets();
  };

  useFrame((state) => {
    const p = progress.get();

    if (lidRef.current) {
      const deg = piecewiseLerp(p, LID_STOPS, LID_DEGREES);
      lidRef.current.rotation.x = THREE.MathUtils.degToRad(deg);
    }

    if (specimenRef.current) {
      const descend = THREE.MathUtils.clamp((p - 0.1) / 0.8, 0, 1);
      specimenRef.current.position.y = THREE.MathUtils.lerp(1.15, -0.35, descend);
      specimenRef.current.rotation.y = state.clock.elapsedTime * 0.25 + p * 6;

      const appear =
        THREE.MathUtils.smoothstep(p, 0.08, 0.18) *
        (1 - THREE.MathUtils.smoothstep(p, 0.9, 0.96));
      specimenRef.current.scale.setScalar(0.001 + appear * 1);

      const continuous = piecewiseLerp(
        p,
        MORPH_STOPS_ARR,
        MORPH_STOPS_ARR.map((_, i) => i)
      );
      const lower = Math.max(0, Math.min(6, Math.floor(continuous)));
      const upper = Math.min(6, lower + 1);
      const frac = continuous - lower;

      const influences = specimenRef.current.morphTargetInfluences;
      if (influences) {
        influences.fill(0);
        influences[lower] = 1 - frac;
        influences[upper] = frac;
      }

      const material = specimenRef.current.material as THREE.MeshStandardMaterial;
      material.color.lerpColors(BRISTOL_COLORS[lower], BRISTOL_COLORS[upper], frac);
    }

    if (waterRef.current) {
      const contact =
        THREE.MathUtils.smoothstep(p, 0.86, 0.92) *
        (1 - THREE.MathUtils.smoothstep(p, 0.94, 1));
      waterRef.current.scale.setScalar(1 + contact * 0.2);
    }

    if (rootRef.current) {
      rootRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08 + p * 0.5;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.15, 0]}>
      <mesh geometry={bowlGeometry}>
        <meshStandardMaterial color="#fbf8f2" roughness={0.55} metalness={0.05} flatShading />
      </mesh>

      <mesh ref={waterRef} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color="#dbe7e4"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      <group ref={lidRef} position={[0, 0.64, -0.1]}>
        <mesh position={[0, 0, 0.1]} scale={[0.88, 0.09, 0.72]}>
          <sphereGeometry args={[1, 28, 16]} />
          <meshStandardMaterial color="#fbf8f2" roughness={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0.1]} scale={[0.7, 0.07, 0.55]}>
          <sphereGeometry args={[1, 24, 14]} />
          <meshStandardMaterial color="#f6f2ea" roughness={0.6} flatShading />
        </mesh>
      </group>

      <mesh
        ref={setSpecimenRef}
        geometry={specimenGeometry}
        position={[0, 1.05, 0]}
        castShadow
      >
        <meshStandardMaterial color={BRISTOL_HEX[0]} roughness={0.85} metalness={0} flatShading />
      </mesh>
    </group>
  );
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function Toilet3DScene({
  progress,
  fallback,
}: {
  progress: MotionValue<number>;
  fallback: ReactNode;
}) {
  return (
    <SceneErrorBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [1.9, 1.5, 2.7], fov: 34 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        className="!absolute !inset-0"
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 2]} intensity={1.3} />
        <directionalLight position={[-2, 1.2, -2]} intensity={0.5} />
        <SceneContent progress={progress} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
