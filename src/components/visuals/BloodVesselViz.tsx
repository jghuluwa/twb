import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface BloodVesselVizProps {
  /** 0-100. Natural NO retention at this age (drives baseline state). */
  noValue: number;
  /** When true, simulate "after 1h of PHOTEX therapy". */
  therapyActive?: boolean;
  className?: string;
}

type PulseUniforms = {
  uTime: { value: number };
  uDilation: { value: number };
  uPulseAmount: { value: number };
  uPulseRate: { value: number };
  uWallAge: { value: number };
};

type RbcState = {
  progress: number;
  laneY: number;
  laneZ: number;
  speed: number;
  phase: number;
  tilt: number;
  size: number;
};

type NoMoleculeState = {
  progress: number;
  laneY: number;
  laneZ: number;
  speed: number;
  phase: number;
  size: number;
};

const VESSEL_LENGTH = 8.4;
const OPEN_START = Math.PI * 0.36;
const OPEN_END = Math.PI * 1.64;

/**
 * Real-time cutaway artery scene.
 *
 * The scene deliberately uses controlled motion instead of CFD: the artery
 * receives a travelling radial pulse while instanced biconcave cells follow
 * the lumen and accelerate through the narrowed section.
 */
export default function BloodVesselViz({
  noValue,
  therapyActive = false,
  className = ''
}: BloodVesselVizProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef({ noValue, therapyActive });
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const displayedNoCount = therapyActive
    ? 40
    : Math.max(3, Math.round(3 + (noValue / 100) * 17));

  inputRef.current = { noValue, therapyActive };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 640px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !compact;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'absolute inset-0 h-full w-full';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08030a, 0.035);

    const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 50);
    camera.position.set(0.15, 4.8, 12.6);
    camera.lookAt(0, -0.1, 0);

    const artery = new THREE.Group();
    artery.rotation.set(0.82, -0.38, -0.08);
    artery.position.y = -0.08;
    scene.add(artery);

    const pulseUniforms: PulseUniforms = {
      uTime: { value: 0 },
      uDilation: { value: 0 },
      uPulseAmount: { value: 0.025 },
      uPulseRate: { value: 4.5 },
      uWallAge: { value: 1 - noValue / 100 }
    };

    const wallMeshes = createVesselWall(pulseUniforms);
    wallMeshes.forEach((mesh) => artery.add(mesh));

    const bloodSurface = createBloodSurface(pulseUniforms);
    artery.add(bloodSurface);

    const plaqueMeshes = createPlaques();
    plaqueMeshes.forEach((mesh) => artery.add(mesh));

    const rbcCount = compact ? 24 : 38;
    const { mesh: rbcMesh, states: rbcStates } = createRedBloodCells(rbcCount);
    artery.add(rbcMesh);

    const noMolecules = createNoMolecules(compact ? 28 : 40);
    artery.add(noMolecules.group);

    const treatmentGlow = createTreatmentGlow();
    artery.add(treatmentGlow.points);

    addLights(scene);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 5),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 })
    );
    shadow.position.set(0, -1.86, -0.55);
    shadow.rotation.x = -Math.PI / 2;
    shadow.receiveShadow = true;
    scene.add(shadow);

    const clock = new THREE.Clock();
    const dummy = new THREE.Object3D();
    const baseRotation = artery.rotation.clone();
    const visual = {
      health: noValue / 100,
      treatment: therapyActive ? 1 : 0,
      dilation: 0,
      deposit: 0.5,
      flush: therapyActive ? 1 : 0
    };
    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;

    const render = () => {
      animationFrame = window.requestAnimationFrame(render);
      const rawDelta = Math.min(clock.getDelta(), 0.04);
      const delta = reduceMotion ? 0 : rawDelta;
      const elapsed = reduceMotion ? 0.7 : clock.elapsedTime;
      const input = inputRef.current;
      const targetHealth = THREE.MathUtils.clamp(input.noValue / 100, 0, 1);
      const targetTreatment = input.therapyActive ? 1 : 0;

      visual.health = damp(visual.health, targetHealth, 3.2, rawDelta);
      visual.treatment = damp(visual.treatment, targetTreatment, targetTreatment ? 8.5 : 4.2, rawDelta);
      visual.dilation = damp(
        visual.dilation,
        (visual.health - 0.5) * 0.035 + visual.treatment * 0.29,
        targetTreatment ? 8.2 : 3.4,
        rawDelta
      );
      visual.deposit = damp(
        visual.deposit,
        0.08 + (1 - visual.health) * 1.02,
        2.8,
        rawDelta
      );
      visual.flush = damp(visual.flush, targetTreatment, targetTreatment ? 7.5 : 5, rawDelta);

      pulseUniforms.uTime.value = elapsed;
      pulseUniforms.uDilation.value = visual.dilation;
      pulseUniforms.uWallAge.value = 1 - visual.health;
      pulseUniforms.uPulseAmount.value =
        0.012 + visual.health * 0.023 + visual.treatment * 0.035;
      pulseUniforms.uPulseRate.value = 4.2 + visual.treatment * 1.5;

      updateDeposits(plaqueMeshes, visual.deposit, visual.flush, elapsed);
      updateRedBloodCells(
        rbcMesh,
        rbcStates,
        dummy,
        delta,
        elapsed,
        visual.health,
        visual.treatment,
        visual.deposit * (1 - visual.flush),
        visual.dilation
      );
      updateNoMolecules(
        noMolecules,
        dummy,
        delta,
        elapsed,
        visual.health,
        visual.treatment,
        visual.dilation
      );
      updateTreatmentGlow(treatmentGlow, elapsed, visual.treatment);

      artery.rotation.x = damp(artery.rotation.x, baseRotation.x + pointerY * 0.055, 3, rawDelta);
      artery.rotation.y = damp(artery.rotation.y, baseRotation.y + pointerX * 0.09, 3, rawDelta);
      artery.rotation.z = baseRotation.z + Math.sin(elapsed * 0.18) * 0.012;

      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative block h-full w-full overflow-hidden ${className}`}
      role="img"
      aria-label="Animated 3D cutaway blood vessel with flowing red blood cells"
      style={{
        background:
          'radial-gradient(ellipse at 50% 58%, rgba(127,29,29,0.24), rgba(15,23,42,0.04) 54%, transparent 76%)'
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-slate-950/55 to-transparent" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 text-[8px] font-bold tracking-[0.18em] text-slate-400 sm:text-[9px]">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
        <span>LIVE 3D CUTAWAY</span>
        <span className="hidden text-slate-600 sm:inline">/</span>
        <span className="hidden sm:inline">{therapyActive ? 'FLOW ENHANCED' : 'AGE-BASED FLOW'}</span>
      </div>
      <div className="pointer-events-none absolute right-2 top-2 z-20 space-y-1 rounded-lg border border-white/10 bg-slate-950/55 px-2 py-1.5 text-[7px] font-bold tracking-wider text-slate-300 backdrop-blur-sm sm:right-3 sm:top-3 sm:text-[8px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.8)]" />
            <span className="-ml-0.5 h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.75)]" />
          </span>
          <span>N-O 一氧化氮 × {displayedNoCount}</span>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span>黄色：循环沉积示意</span>
        </div>
      </div>
      {webglUnavailable && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-semibold text-slate-400">
          3D visualization is unavailable in this browser.
        </div>
      )}
    </div>
  );
}

function createVesselWall(uniforms: PulseUniforms) {
  const layers = [
    {
      outer: 1.52,
      inner: 1.34,
      ageInsets: [0, 0.1],
      colors: [0xb85e58, 0x7c222b, 0xe0a09a],
      roughness: 0.78
    },
    {
      outer: 1.33,
      inner: 1.16,
      ageInsets: [0.1, 0.22],
      colors: [0x9d303d, 0x64151f, 0xc76068],
      roughness: 0.68
    },
    {
      outer: 1.15,
      inner: 1.055,
      ageInsets: [0.22, 0.34],
      colors: [0xe07c7d, 0x741821, 0xf2aaa5],
      roughness: 0.5
    }
  ];

  return layers.map((layer, layerIndex) => {
    const materials = layer.colors.map((color, materialIndex) => {
      const material = new THREE.MeshPhysicalMaterial({
        color,
        roughness: materialIndex === 2 ? layer.roughness + 0.08 : layer.roughness,
        metalness: 0,
        clearcoat: materialIndex === 1 ? 0.28 : 0.12,
        clearcoatRoughness: 0.58,
        side: THREE.DoubleSide
      });
      installPulseShader(material, uniforms, 'wall');
      return material;
    });
    const mesh = new THREE.Mesh(
      createCutawayTubeGeometry(
        VESSEL_LENGTH,
        layer.outer,
        layer.inner,
        layer.ageInsets[0],
        layer.ageInsets[1],
        34,
        58
      ),
      materials
    );
    mesh.castShadow = layerIndex === 0;
    mesh.receiveShadow = true;
    mesh.renderOrder = layerIndex;
    return mesh;
  });
}

function createBloodSurface(uniforms: PulseUniforms) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x3b0710,
    emissive: 0x240006,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.62,
    clearcoatRoughness: 0.35,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  installPulseShader(material, uniforms, 'lumen');
  const mesh = new THREE.Mesh(createArcGeometry(VESSEL_LENGTH, 1.035, 34, 58), material);
  mesh.renderOrder = 3;
  mesh.receiveShadow = true;
  return mesh;
}

function createPlaques() {
  const geometry = new THREE.SphereGeometry(1, 20, 14);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xe0ae43,
    emissive: 0x3a1500,
    emissiveIntensity: 0.18,
    roughness: 0.9,
    clearcoat: 0.08
  });
  const positions = [
    [-1.65, -0.73, -0.32, 0.82, 0.45, 0.42],
    [-1.12, -0.76, 0.08, 0.66, 0.37, 0.34],
    [-0.67, -0.72, -0.05, 0.92, 0.46, 0.44],
    [-0.12, -0.75, 0.31, 0.58, 0.32, 0.3],
    [0.22, -0.7, -0.29, 0.76, 0.42, 0.38],
    [0.72, -0.7, 0.08, 0.96, 0.48, 0.44],
    [1.22, -0.74, -0.24, 0.7, 0.39, 0.34],
    [1.62, -0.76, 0.24, 0.54, 0.3, 0.28],
    [-0.4, -0.6, -0.48, 0.5, 0.3, 0.34],
    [0.85, -0.6, 0.44, 0.48, 0.28, 0.32]
  ];

  return positions.map(([x, y, z, sx, sy, sz], index) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(index * 0.41, index * 0.23, index * 0.67);
    mesh.userData.baseScale = new THREE.Vector3(sx, sy, sz);
    mesh.userData.basePosition = mesh.position.clone();
    mesh.scale.setScalar(0.05);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 4;
    return mesh;
  });
}

function updateDeposits(meshes: THREE.Mesh[], severity: number, flush: number, elapsed: number) {
  meshes.forEach((mesh, index) => {
    const base = mesh.userData.baseScale as THREE.Vector3;
    const basePosition = mesh.userData.basePosition as THREE.Vector3;
    const prominence = THREE.MathUtils.clamp(severity * 1.08 - index * 0.018, 0.04, 1.12);
    const remaining = Math.pow(1 - flush, 1.35);
    const target = base.clone().multiplyScalar(prominence * remaining);
    const sweep = flush * (5.4 + index * 0.22);
    mesh.position.set(
      basePosition.x + sweep,
      basePosition.y + Math.sin(elapsed * 8 + index) * flush * 0.2,
      basePosition.z + Math.cos(elapsed * 7 + index * 0.7) * flush * 0.22
    );
    mesh.rotation.x += flush * 0.08;
    mesh.rotation.z += flush * 0.12;
    mesh.scale.lerp(target, flush > 0.02 ? 0.18 : 0.065);
  });
}

function createRedBloodCells(count: number) {
  const geometry = createRbcGeometry();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc91924,
    emissive: 0x310006,
    emissiveIntensity: 0.28,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.72,
    clearcoatRoughness: 0.22
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.renderOrder = 5;

  const states: RbcState[] = Array.from({ length: count }, (_, index) => ({
    progress: fract(index * 0.61803398875),
    laneY: pseudoRandom(index * 3 + 1) * 1.18 - 0.59,
    laneZ: pseudoRandom(index * 5 + 7) * 0.68 - 0.47,
    speed: 0.78 + pseudoRandom(index * 7 + 3) * 0.42,
    phase: pseudoRandom(index * 11 + 5) * Math.PI * 2,
    tilt: pseudoRandom(index * 13 + 9) * 0.8 - 0.4,
    size: 0.31 + pseudoRandom(index * 17 + 2) * 0.08
  }));

  return { mesh, states };
}

function updateRedBloodCells(
  mesh: THREE.InstancedMesh,
  states: RbcState[],
  dummy: THREE.Object3D,
  delta: number,
  elapsed: number,
  health: number,
  treatment: number,
  plaque: number,
  dilation: number
) {
  const flowRate = 0.068 + health * 0.035 + treatment * 0.055;

  states.forEach((cell, index) => {
    const currentX = -VESSEL_LENGTH / 2 + cell.progress * VESSEL_LENGTH;
    const pinch = Math.exp(-Math.pow(currentX / 1.28, 2)) * plaque;
    cell.progress = fract(cell.progress + delta * flowRate * cell.speed * (1 + pinch * 0.7));

    const x = -VESSEL_LENGTH / 2 + cell.progress * VESSEL_LENGTH;
    const localPinch = Math.exp(-Math.pow(x / 1.28, 2)) * plaque;
    const lumenScale = 1 + dilation - (1 - health) * 0.22 - localPinch * 0.19;
    const drift = Math.sin(elapsed * 0.7 + cell.phase + x * 0.35) * 0.035;
    const pulse = Math.sin(elapsed * (4.2 + treatment * 1.5) - x * 2.15) *
      (0.012 + health * 0.023 + treatment * 0.035);

    dummy.position.set(
      x,
      (cell.laneY + drift) * lumenScale,
      (cell.laneZ + pulse * 1.8) * lumenScale
    );
    const tumble = elapsed * cell.speed * (0.55 + treatment * 0.2) + cell.phase;
    dummy.rotation.set(
      Math.PI / 2 + Math.sin(tumble) * 0.34,
      cell.tilt + Math.sin(tumble * 0.47) * 0.3,
      tumble * 0.42
    );
    const stretch = 1 + localPinch * 0.26;
    dummy.scale.set(cell.size * stretch, cell.size * (1 - localPinch * 0.11), cell.size);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function createNoMolecules(count: number) {
  const atomGeometry = new THREE.SphereGeometry(1, 14, 10);
  const bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  const nitrogenMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x0e7490,
    emissiveIntensity: 1.2,
    roughness: 0.22,
    clearcoat: 0.8
  });
  const oxygenMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfb7185,
    emissive: 0xbe123c,
    emissiveIntensity: 0.95,
    roughness: 0.24,
    clearcoat: 0.8
  });
  const bondMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    emissive: 0x67e8f9,
    emissiveIntensity: 0.5,
    roughness: 0.3
  });

  const nitrogen = new THREE.InstancedMesh(atomGeometry, nitrogenMaterial, count);
  const oxygen = new THREE.InstancedMesh(atomGeometry, oxygenMaterial, count);
  const bonds = new THREE.InstancedMesh(bondGeometry, bondMaterial, count);
  [nitrogen, oxygen, bonds].forEach((mesh) => {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.renderOrder = 7;
  });

  const group = new THREE.Group();
  group.add(nitrogen, oxygen, bonds);
  const states: NoMoleculeState[] = Array.from({ length: count }, (_, index) => ({
    progress: fract(index * 0.754877666),
    laneY: pseudoRandom(index * 19 + 4) * 0.9 - 0.34,
    laneZ: pseudoRandom(index * 23 + 8) * 0.82 - 0.36,
    speed: 0.8 + pseudoRandom(index * 29 + 2) * 0.52,
    phase: pseudoRandom(index * 31 + 6) * Math.PI * 2,
    size: 0.1 + pseudoRandom(index * 37 + 3) * 0.035
  }));

  return { group, nitrogen, oxygen, bonds, states, count };
}

function updateNoMolecules(
  molecules: ReturnType<typeof createNoMolecules>,
  dummy: THREE.Object3D,
  delta: number,
  elapsed: number,
  health: number,
  treatment: number,
  dilation: number
) {
  const activeCount = Math.min(
    molecules.count,
    Math.round(3 + health * 17 + treatment * 20)
  );
  const atomOffset = 0.16;
  const direction = new THREE.Vector3();
  const center = new THREE.Vector3();
  const atomPosition = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const zeroScale = new THREE.Vector3(0, 0, 0);

  molecules.states.forEach((molecule, index) => {
    if (index >= activeCount) {
      dummy.position.set(0, 0, 0);
      dummy.scale.copy(zeroScale);
      dummy.updateMatrix();
      molecules.nitrogen.setMatrixAt(index, dummy.matrix);
      molecules.oxygen.setMatrixAt(index, dummy.matrix);
      molecules.bonds.setMatrixAt(index, dummy.matrix);
      return;
    }

    molecule.progress = fract(
      molecule.progress + delta * molecule.speed * (0.12 + treatment * 0.12)
    );
    const x = -VESSEL_LENGTH / 2 + molecule.progress * VESSEL_LENGTH;
    const lumenScale = 1 + dilation - (1 - health) * 0.22;
    const swirl = elapsed * (1.3 + treatment) + molecule.phase + x * 0.18;
    center.set(
      x,
      (molecule.laneY + Math.sin(swirl) * 0.08) * lumenScale,
      (molecule.laneZ + Math.cos(swirl * 0.83) * 0.09) * lumenScale
    );
    direction.set(
      1,
      Math.sin(swirl * 1.7) * 0.25,
      Math.cos(swirl * 1.3) * 0.25
    ).normalize();
    const moleculeScale = molecule.size * (1 + treatment * 0.14);

    atomPosition.copy(center).addScaledVector(direction, -atomOffset);
    dummy.position.copy(atomPosition);
    dummy.quaternion.identity();
    dummy.scale.setScalar(moleculeScale);
    dummy.updateMatrix();
    molecules.nitrogen.setMatrixAt(index, dummy.matrix);

    atomPosition.copy(center).addScaledVector(direction, atomOffset);
    dummy.position.copy(atomPosition);
    dummy.scale.setScalar(moleculeScale);
    dummy.updateMatrix();
    molecules.oxygen.setMatrixAt(index, dummy.matrix);

    dummy.position.copy(center);
    dummy.quaternion.setFromUnitVectors(yAxis, direction);
    dummy.scale.set(moleculeScale * 0.34, atomOffset * 2, moleculeScale * 0.34);
    dummy.updateMatrix();
    molecules.bonds.setMatrixAt(index, dummy.matrix);
  });

  molecules.nitrogen.instanceMatrix.needsUpdate = true;
  molecules.oxygen.instanceMatrix.needsUpdate = true;
  molecules.bonds.instanceMatrix.needsUpdate = true;
}

function createTreatmentGlow() {
  const count = 38;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    phases[i] = pseudoRandom(i + 41) * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 0.055,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 6;
  return { points, phases, opacity: 0 };
}

function updateTreatmentGlow(
  glow: ReturnType<typeof createTreatmentGlow>,
  elapsed: number,
  treatment: number
) {
  glow.opacity = THREE.MathUtils.lerp(glow.opacity, treatment * 0.75, 0.07);
  const material = glow.points.material as THREE.PointsMaterial;
  material.opacity = glow.opacity;
  const position = glow.points.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < glow.phases.length; i += 1) {
    const phase = glow.phases[i];
    const x = -VESSEL_LENGTH / 2 + fract(phase / (Math.PI * 2) + elapsed * 0.035) * VESSEL_LENGTH;
    const angle = phase + elapsed * 0.72;
    const radius = 1.57 + Math.sin(phase * 2.3) * 0.08;
    position.setXYZ(i, x, Math.sin(angle) * radius, Math.cos(angle) * radius);
  }
  position.needsUpdate = true;
}

function createRbcGeometry() {
  const profile: THREE.Vector2[] = [];
  const segments = 24;
  for (let i = 0; i <= segments; i += 1) {
    const radius = i / segments;
    const halfHeight = 0.075 + 0.245 * Math.pow(Math.sin(Math.PI * radius), 0.68);
    profile.push(new THREE.Vector2(radius, halfHeight));
  }
  for (let i = segments; i >= 0; i -= 1) {
    const radius = i / segments;
    const halfHeight = 0.075 + 0.245 * Math.pow(Math.sin(Math.PI * radius), 0.68);
    profile.push(new THREE.Vector2(radius, -halfHeight));
  }
  const geometry = new THREE.LatheGeometry(profile, 42);
  geometry.computeVertexNormals();
  return geometry;
}

function createCutawayTubeGeometry(
  length: number,
  outerRadius: number,
  innerRadius: number,
  outerAgeInset: number,
  innerAgeInset: number,
  lengthSegments: number,
  radialSegments: number
) {
  const positions: number[] = [];
  const ageInsets: number[] = [];
  const indices: number[] = [];
  const outer: number[][] = [];
  const inner: number[][] = [];

  const addVertex = (x: number, radius: number, angle: number, ageInset: number) => {
    positions.push(x, Math.cos(angle) * radius, Math.sin(angle) * radius);
    ageInsets.push(ageInset);
    return positions.length / 3 - 1;
  };
  const addQuad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, d, b, c, d);
  };

  for (let xIndex = 0; xIndex <= lengthSegments; xIndex += 1) {
    const x = -length / 2 + (xIndex / lengthSegments) * length;
    outer[xIndex] = [];
    inner[xIndex] = [];
    for (let angleIndex = 0; angleIndex <= radialSegments; angleIndex += 1) {
      const angle = THREE.MathUtils.lerp(OPEN_START, OPEN_END, angleIndex / radialSegments);
      outer[xIndex][angleIndex] = addVertex(x, outerRadius, angle, outerAgeInset);
      inner[xIndex][angleIndex] = addVertex(x, innerRadius, angle, innerAgeInset);
    }
  }

  let groupStart = indices.length;
  for (let x = 0; x < lengthSegments; x += 1) {
    for (let a = 0; a < radialSegments; a += 1) {
      addQuad(outer[x][a], outer[x + 1][a], outer[x + 1][a + 1], outer[x][a + 1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.addGroup(groupStart, indices.length - groupStart, 0);
  groupStart = indices.length;
  for (let x = 0; x < lengthSegments; x += 1) {
    for (let a = 0; a < radialSegments; a += 1) {
      addQuad(inner[x][a + 1], inner[x + 1][a + 1], inner[x + 1][a], inner[x][a]);
    }
  }
  geometry.addGroup(groupStart, indices.length - groupStart, 1);
  groupStart = indices.length;

  for (let x = 0; x < lengthSegments; x += 1) {
    addQuad(outer[x][0], inner[x][0], inner[x + 1][0], outer[x + 1][0]);
    addQuad(
      inner[x][radialSegments],
      outer[x][radialSegments],
      outer[x + 1][radialSegments],
      inner[x + 1][radialSegments]
    );
  }
  for (let a = 0; a < radialSegments; a += 1) {
    addQuad(outer[0][a + 1], outer[0][a], inner[0][a], inner[0][a + 1]);
    addQuad(
      outer[lengthSegments][a],
      outer[lengthSegments][a + 1],
      inner[lengthSegments][a + 1],
      inner[lengthSegments][a]
    );
  }
  geometry.addGroup(groupStart, indices.length - groupStart, 2);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('ageInset', new THREE.Float32BufferAttribute(ageInsets, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createArcGeometry(
  length: number,
  radius: number,
  lengthSegments: number,
  radialSegments: number
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let xIndex = 0; xIndex <= lengthSegments; xIndex += 1) {
    const x = -length / 2 + (xIndex / lengthSegments) * length;
    for (let angleIndex = 0; angleIndex <= radialSegments; angleIndex += 1) {
      const angle = THREE.MathUtils.lerp(OPEN_START, OPEN_END, angleIndex / radialSegments);
      positions.push(x, Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  }
  const stride = radialSegments + 1;
  for (let x = 0; x < lengthSegments; x += 1) {
    for (let a = 0; a < radialSegments; a += 1) {
      const topLeft = x * stride + a;
      indices.push(topLeft, topLeft + stride, topLeft + stride + 1, topLeft, topLeft + stride + 1, topLeft + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function installPulseShader(
  material: THREE.MeshPhysicalMaterial,
  uniforms: PulseUniforms,
  mode: 'wall' | 'lumen'
) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         uniform float uDilation;
         uniform float uPulseAmount;
         uniform float uPulseRate;
         uniform float uWallAge;
         ${mode === 'wall' ? 'attribute float ageInset;' : ''}`
      )
      .replace(
        '#include <begin_vertex>',
        `float pulseWave = sin(uTime * uPulseRate - position.x * 2.15) * uPulseAmount;
         ${
           mode === 'wall'
             ? `vec3 agedPosition = position;
                agedPosition.yz -= normalize(position.yz) * ageInset * uWallAge;
                float radiusScale = 1.0 + uDilation + pulseWave;
                vec3 transformed = vec3(agedPosition.x, agedPosition.y * radiusScale, agedPosition.z * radiusScale);`
             : `float radiusScale = 1.0 + uDilation + pulseWave - uWallAge * 0.26;
                vec3 transformed = vec3(position.x, position.y * radiusScale, position.z * radiusScale);`
         }`
      );
  };
  material.customProgramCacheKey = () => `therabo-vessel-pulse-v2-${mode}`;
}

function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffd7d2, 0x16040a, 1.6));

  const key = new THREE.DirectionalLight(0xffded5, 4.4);
  key.position.set(-3.5, 6, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  scene.add(key);

  const redFill = new THREE.PointLight(0xff294d, 9, 12, 2);
  redFill.position.set(3.2, -0.2, 3.6);
  scene.add(redFill);

  const rim = new THREE.PointLight(0x8be9ff, 5.5, 14, 2);
  rim.position.set(-4, 3.2, -2.5);
  scene.add(rim);
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

function fract(value: number) {
  return value - Math.floor(value);
}

function pseudoRandom(seed: number) {
  return fract(Math.sin(seed * 12.9898) * 43758.5453);
}
