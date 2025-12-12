import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Environment, Sparkles, shaderMaterial, useCursor, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GIFTS, GOLD_COLOR, LIGHT_COLORS, TREE_COLOR_BASE, TREE_COLOR_TIP, SNOW_COLOR } from '../constants';
import { GiftMessage } from '../types';

// --- Custom Shader for Foliage ---
const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uMix: 0, // 0 = Chaos, 1 = Formed
    uColorBase: new THREE.Color(TREE_COLOR_BASE),
    uColorTip: new THREE.Color(TREE_COLOR_TIP),
    uSize: 6.0,
  },
  // Vertex Shader
  `
    attribute vec3 aChaosPos;
    varying float vMix;
    varying float vHeight;
    varying float vRand;
    uniform float uMix;
    uniform float uTime;
    uniform float uSize;

    void main() {
      vMix = uMix;
      vRand = fract(sin(dot(aChaosPos.xy, vec2(12.9898, 78.233))) * 43758.5453);
      
      // Cubic easing for smoother transition
      float t = uMix;
      float ease = t * t * (3.0 - 2.0 * t);
      
      vec3 pos = mix(aChaosPos, position, ease);
      
      // Gentle wind effect
      if (ease > 0.8) {
        float wind = sin(uTime * 1.0 + position.y * 0.5) * 0.1;
        float windZ = cos(uTime * 0.8 + position.y * 0.3) * 0.1;
        pos.x += wind;
        pos.z += windZ;
      }

      vHeight = pos.y; 

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation with safe z-divide
      float zDist = max(1.0, -mvPosition.z); 
      float size = uSize * (1.0 + sin(uTime * 2.0 + vRand * 10.0) * 0.3); 
      gl_PointSize = size * (25.0 / zDist);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    uniform float uTime;
    varying float vHeight;
    varying float vRand;

    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;

      // Soft Glow Particle
      float strength = pow(1.0 - dist * 2.0, 2.5);
      
      // Gradient based on height
      float h = smoothstep(-10.0, 10.0, vHeight);
      vec3 baseColor = mix(uColorBase, uColorTip, h);
      
      // Magic Twinkle
      float twinkleSpeed = 3.0;
      float twinkle = sin(uTime * twinkleSpeed + vRand * 6.28);
      float flash = step(0.8, twinkle);
      
      vec3 color = baseColor;
      
      // Gold highlights
      if (flash > 0.5) {
         color = mix(color, vec3(1.0, 0.9, 0.5), 0.8);
         strength *= 1.5;
      }

      gl_FragColor = vec4(color, strength);
    }
  `
);

// --- Custom Shader for Snowflakes ---
const SnowflakeMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(SNOW_COLOR),
  },
  // Vertex
  `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv; 
      vec3 pos = position;
      
      // Spiral fall
      pos.x += sin(uTime * 0.5 + position.y * 0.2) * 2.0;
      pos.z += cos(uTime * 0.5 + position.y * 0.2) * 2.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float zDist = max(1.0, -mvPosition.z);
      gl_PointSize = 300.0 / zDist; 
    }
  `,
  // Fragment
  `
    uniform vec3 uColor;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      
      // 6-pointed star shape logic
      float f = abs(cos(a * 3.0)); // 6 symmetry lobes
      float shape = smoothstep(0.4, 0.0, r) * smoothstep(0.1, 0.3, f * r + 0.1);
      
      // Core glow
      float core = 1.0 - smoothstep(0.0, 0.1, r);
      
      float alpha = shape + core * 0.5;
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(uColor, alpha * 0.8);
    }
  `
);

// --- Custom Shader for The Eight-Tone Aperture (Ba Yin Qiao) ---
// White Jade with Cloud Patterns and Evenly Distributed Holes
const OrbMaterial = shaderMaterial(
    {
        uTime: 0,
        uColorBase: new THREE.Color('#F0F8FF'), // Alice Blue / White Jade
        uColorIridescent: new THREE.Color('#E6E6FA'), // Lavender mist
    },
    // Vertex
    `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vViewDir;
    
    void main() {
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
    }
    `,
    // Fragment
    `
    precision highp float;
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorIridescent;
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vViewDir;

    void main() {
        // --- 1. Evenly Distributed Holes (Apertures) ---
        // Scale factor controls number of holes
        vec3 p = vPos * 3.5; 
        // Classic Gyroid approximation for organic but regular holes
        float gyroid = sin(p.x)*cos(p.y) + sin(p.y)*cos(p.z) + sin(p.z)*cos(p.x);
        
        // Threshold defines hole size. 
        if (gyroid > 0.45) discard;

        // --- 2. Cloud Patterns (Yun Wen) ---
        // Create a swirling pattern on the surface using sine wave interference
        float pattern = sin(vPos.x * 6.0 + uTime * 0.2) * sin(vPos.y * 6.0 - uTime * 0.1) * sin(vPos.z * 6.0);
        
        // --- 3. Lighting & Jade Texture ---
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewDir);
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular (Glossy Jade)
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 64.0);
        
        // Fresnel (Pearlescent rim)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        
        // Combine colors
        // Base white jade color mixed slightly with cloud pattern for relief look
        vec3 albedo = mix(uColorBase, vec3(1.0, 1.0, 1.0), pattern * 0.2);
        
        // Add iridescent sheen (purple/pinkish) based on fresnel and pattern
        vec3 sheen = mix(vec3(0.0), vec3(0.8, 0.6, 1.0), fresnel * 0.8);
        
        // Final Composition
        vec3 finalColor = albedo * (diff * 0.6 + 0.4) + spec * 0.5 + sheen;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
    `
);

extend({ FoliageMaterial, SnowflakeMaterial, OrbMaterial });

// --- Components ---

const Foliage = ({ isExploded }: { isExploded: boolean }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const count = 20000; 
  
  const { positions, chaosPositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const h = Math.random() * 20 - 10;
      const hNorm = (h + 10) / 20; 
      const rBase = (1 - hNorm) * 8.5;
      const r = rBase * Math.sqrt(Math.random()); 
      const theta = Math.random() * Math.PI * 2;
      
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = r * Math.sin(theta);

      const phi = Math.acos(2 * Math.random() - 1);
      const thetaS = Math.random() * Math.PI * 2;
      const radS = 40 + Math.random() * 20;
      
      chaos[i * 3] = radS * Math.sin(phi) * Math.cos(thetaS);
      chaos[i * 3 + 1] = radS * Math.sin(phi) * Math.sin(thetaS);
      chaos[i * 3 + 2] = radS * Math.cos(phi);
    }
    return { positions: pos, chaosPositions: chaos };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetMix = isExploded ? 0 : 1;
      materialRef.current.uniforms.uMix.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uMix.value,
        targetMix,
        0.02
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={chaosPositions.length / 3} array={chaosPositions} itemSize={3} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial 
        ref={materialRef} 
        transparent 
        depthWrite={false} 
        blending={THREE.AdditiveBlending}
        uColorBase={new THREE.Color(TREE_COLOR_BASE)}
        uColorTip={new THREE.Color(TREE_COLOR_TIP)}
      />
    </points>
  );
};

const Snow = () => {
    const count = 500; 
    const ref = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const { positions } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 60;
            pos[i*3+1] = (Math.random() - 0.5) * 60;
            pos[i*3+2] = (Math.random() - 0.5) * 60;
        }
        return { positions: pos };
    }, []);

    useFrame((state, delta) => {
        if (materialRef.current) {
             materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
        if(!ref.current) return;
        
        const positions = ref.current.geometry.attributes.position.array as Float32Array;
        for(let i=1; i<positions.length; i+=3) {
            positions[i] -= delta * 3; 
            if(positions[i] < -30) positions[i] = 30;
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            </bufferGeometry>
            {/* @ts-ignore */}
            <snowflakeMaterial 
                ref={materialRef}
                transparent 
                depthWrite={false} 
                blending={THREE.AdditiveBlending} 
            />
        </points>
    )
}

// Mystical Orb Component (Ba Yin Qiao)
// Updated to feature White Jade outer shell + Purple Inner Core
const MysticalOrb = ({ position, scale = 1, speed = 1 }: { position: THREE.Vector3, scale?: number, speed?: number }) => {
    const ref = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state, delta) => {
        if (!ref.current || !materialRef.current) return;
        
        // Slow rotation
        ref.current.rotation.x += delta * 0.2 * speed;
        ref.current.rotation.y += delta * 0.3 * speed;
        
        // Bobbing
        ref.current.position.y += Math.sin(state.clock.elapsedTime * speed + position.x) * 0.005;

        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <group ref={ref} position={position} scale={scale}>
            {/* Outer Shell: White Jade with Cloud Patterns & Holes */}
            <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                {/* @ts-ignore */}
                <orbMaterial 
                    ref={materialRef} 
                    side={THREE.DoubleSide} 
                />
            </mesh>
            
            {/* Inner Core: Solid Purple Sphere */}
            <mesh scale={0.7}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial 
                    color="#6d28d9" 
                    emissive="#4c1d95"
                    emissiveIntensity={1.5}
                    roughness={0.4}
                    metalness={0.5}
                />
            </mesh>
            {/* Core Lights to make it glow from inside */}
            <pointLight color="#a855f7" intensity={1} distance={2.5} decay={2} />
        </group>
    );
};

// Collection of Orbs orbiting the tree
const MysticalOrbs = ({ isExploded }: { isExploded: boolean }) => {
    const count = 8; // Eight tones -> Eight orbs
    const orbs = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const r = 10 + Math.random() * 4;
            const y = (Math.random() - 0.5) * 16;
            return {
                pos: new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)),
                scale: 0.8 + Math.random() * 0.6,
                speed: 0.5 + Math.random() * 0.5
            };
        });
    }, []);

    return (
        <group>
            {orbs.map((orb, i) => (
                <Float key={i} speed={orb.speed} rotationIntensity={0.5} floatIntensity={1}>
                     <MysticalOrb 
                        position={isExploded ? orb.pos.clone().multiplyScalar(2) : orb.pos} 
                        scale={orb.scale}
                        speed={orb.speed}
                     />
                </Float>
            ))}
        </group>
    );
}

const Ornaments = ({ isExploded }: { isExploded: boolean }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 350;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { targetData, chaosData, colors } = useMemo(() => {
    const tData = [];
    const cData = [];
    const cols = new Float32Array(count * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const hNorm = Math.random(); 
      const y = hNorm * 18 - 9;
      const r = (1 - hNorm) * 8.8; 
      const theta = y * 2.5 + Math.random() * Math.PI * 2; 
      
      tData.push({ x: r * Math.cos(theta), y, z: r * Math.sin(theta) });

      const thetaS = Math.random() * Math.PI * 2;
      const phiS = Math.acos(2 * Math.random() - 1);
      const radS = 45 + Math.random() * 10;
      cData.push({
        x: radS * Math.sin(phiS) * Math.cos(thetaS),
        y: radS * Math.sin(phiS) * Math.sin(thetaS),
        z: radS * Math.cos(phiS)
      });

      colorObj.set(LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)]);
      // Boost intensity for bloom
      colorObj.multiplyScalar(1.5);
      colorObj.toArray(cols, i * 3);
    }
    return { targetData: tData, chaosData: cData, colors: cols };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const targetMix = isExploded ? 0 : 1;
    if (meshRef.current.userData.mix === undefined) meshRef.current.userData.mix = 0;
    
    meshRef.current.userData.mix = THREE.MathUtils.lerp(
      meshRef.current.userData.mix,
      targetMix,
      0.03
    );
    
    const m = meshRef.current.userData.mix;
    const ease = m * m * (3 - 2 * m);

    for (let i = 0; i < count; i++) {
        const chaos = chaosData[i];
        const target = targetData[i];
        
        const x = THREE.MathUtils.lerp(chaos.x, target.x, ease);
        const y = THREE.MathUtils.lerp(chaos.y, target.y, ease);
        const z = THREE.MathUtils.lerp(chaos.z, target.z, ease);
        
        dummy.position.set(x, y, z);
        const scale = 0.25 * (0.2 + 0.8 * ease); 
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        toneMapped={false}
        roughness={0.2}
        metalness={1.0}
        emissiveIntensity={1}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
};

const InteractiveGift = ({ 
    gift, index, total, onClick, isExploded 
}: { 
    gift: GiftMessage, index: number, total: number, onClick: (g: GiftMessage) => void, isExploded: boolean
}) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);
    
    const { targetPos, chaosPos } = useMemo(() => {
        const hNorm = 0.15 + (index / total) * 0.65;
        const y = hNorm * 16 - 8;
        const r = (1 - hNorm) * 9.5 + 1.0;
        const theta = (index / total) * Math.PI * 2 * 3.5;
        return { 
            targetPos: new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)), 
            chaosPos: new THREE.Vector3((Math.random()-0.5)*80, (Math.random()-0.5)*80, (Math.random()-0.5)*80) 
        };
    }, [index, total]);

    const ref = useRef<THREE.Group>(null);
    const mixRef = useRef(0);

    useFrame((state, delta) => {
        if (!ref.current) return;
        const targetMix = isExploded ? 0 : 1;
        mixRef.current = THREE.MathUtils.lerp(mixRef.current, targetMix, delta * 1.5);
        
        ref.current.position.lerpVectors(chaosPos, targetPos, mixRef.current);
        
        if (mixRef.current > 0.9) {
           const time = state.clock.elapsedTime;
           // Floating animation
           ref.current.position.y += Math.sin(time * 2 + index) * 0.005;
           // Gentle rotation
           ref.current.rotation.y = Math.sin(time * 0.5 + index) * 0.2;
           ref.current.rotation.z = Math.sin(time * 0.3 + index) * 0.1;
           
           if(hovered) {
               ref.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), delta * 10);
           } else {
               ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 5);
           }
        } else {
           ref.current.rotation.x += delta;
           ref.current.rotation.z += delta;
        }
    });

    return (
        <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick(gift); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
            {/* Glowing core when hovered */}
            <pointLight distance={3} intensity={hovered ? 5 : 0} color={gift.color} decay={2} />
            
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshStandardMaterial 
                    color={gift.color} 
                    metalness={0.5} 
                    roughness={0.2}
                    emissive={gift.color}
                    emissiveIntensity={hovered ? 0.5 : 0}
                />
            </mesh>
            {/* Ribbons */}
            <mesh scale={[1.05, 1.05, 0.25]}>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshStandardMaterial color={GOLD_COLOR} metalness={1} roughness={0.1} />
            </mesh>
            <mesh scale={[0.25, 1.05, 1.05]}>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshStandardMaterial color={GOLD_COLOR} metalness={1} roughness={0.1} />
            </mesh>
        </group>
    );
};

// A Merkaba-style 3D Star
const StarTopper = ({ isExploded }: { isExploded: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    const mixRef = useRef(0);
    const targetPos = new THREE.Vector3(0, 10.8, 0);
    const chaosPos = new THREE.Vector3(0, 60, 0);

    useFrame((state, delta) => {
        if (!ref.current) return;
        const targetMix = isExploded ? 0 : 1;
        mixRef.current = THREE.MathUtils.lerp(mixRef.current, targetMix, delta * 0.8);
        ref.current.position.lerpVectors(chaosPos, targetPos, mixRef.current);
        
        // Spin
        ref.current.rotation.y += delta * 0.5;
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
    });

    return (
        <group ref={ref}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <group scale={1.5}>
                     {/* Tetrahedron 1 */}
                    <mesh>
                        <octahedronGeometry args={[1.2, 0]} />
                        <meshStandardMaterial color={GOLD_COLOR} emissive={GOLD_COLOR} emissiveIntensity={2} toneMapped={false} />
                    </mesh>
                    {/* Tetrahedron 2 (Inverted) */}
                    <mesh rotation={[0, 0, Math.PI / 4]} scale={0.8}>
                        <octahedronGeometry args={[1.2, 0]} />
                        <meshStandardMaterial color="#FFF" emissive="#FFF" emissiveIntensity={1} toneMapped={false} transparent opacity={0.8} />
                    </mesh>
                </group>
            </Float>
            <pointLight color={GOLD_COLOR} intensity={3} distance={15} decay={2} />
            {/* Halo Effect */}
            <Sparkles count={50} scale={4} size={6} speed={0.4} opacity={1} color="#FFF" />
        </group>
    );
}

// --- Main Scene ---
interface TreeCanvasProps {
  onGiftClick: (gift: GiftMessage) => void;
  isExploded: boolean;
}

const TreeCanvas: React.FC<TreeCanvasProps> = ({ onGiftClick, isExploded }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}
      camera={{ position: [0, 2, 28], fov: 45 }}
    >
      <color attach="background" args={['#000500']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <spotLight position={[20, 30, 20]} angle={0.25} penumbra={1} intensity={300} color="#ffeedd" castShadow />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#00ff00" />
      <pointLight position={[10, -5, 10]} intensity={50} color="#ff0000" />

      <Environment preset="night" background={false} blur={0.8} />

      <group position={[0, -6, 0]}>
        <Snow />
        <MysticalOrbs isExploded={isExploded} />
        <Foliage isExploded={isExploded} />
        <Ornaments isExploded={isExploded} />
        <StarTopper isExploded={isExploded} />
        {/* Removed WindingKey */}
        
        {GIFTS.map((gift, i) => (
            <InteractiveGift 
                key={gift.id} 
                gift={gift} 
                index={i} 
                total={GIFTS.length} 
                onClick={onGiftClick}
                isExploded={isExploded}
            />
        ))}
      </group>

      {/* Background Magic */}
      <Sparkles count={300} scale={[25, 25, 25]} size={3} speed={0.2} opacity={0.4} color={GOLD_COLOR} />
      
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={2.0} radius={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={15}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
};

export default TreeCanvas;