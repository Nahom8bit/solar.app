import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const EARTH_YEAR = 2 * Math.PI
const ORBITAL_PERIOD_SCALE = 0.01

const planetData = {
  Mercury: { mass: '3.3011e23 kg', diameter: '4,879 km', dayLength: '58.65 Earth days', moons: 0 },
  Venus: { mass: '4.8675e24 kg', diameter: '12,104 km', dayLength: '243 Earth days', moons: 0 },
  Earth: { mass: '5.97e24 kg', diameter: '12,742 km', dayLength: '24 hours', moons: 1 },
  Mars: { mass: '6.4171e23 kg', diameter: '6,779 km', dayLength: '24.6 hours', moons: 2 },
  Jupiter: { mass: '1.8982e27 kg', diameter: '139,820 km', dayLength: '9.93 hours', moons: 79 },
  Saturn: { mass: '5.6834e26 kg', diameter: '116,460 km', dayLength: '10.7 hours', moons: 82 },
  Uranus: { mass: '8.6810e25 kg', diameter: '50,724 km', dayLength: '17.2 hours', moons: 27 },
  Neptune: { mass: '1.02413e26 kg', diameter: '49,244 km', dayLength: '16.1 hours', moons: 14 }
}

type PlanetName = keyof typeof planetData;

function Sun() {
  const sunTexture = useTexture('/textures/sun.jpg')
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial map={sunTexture} />
      <pointLight intensity={1.5} />
    </mesh>
  )
}

function Planet({ orbit, color, size, speed, name, moons }: { orbit: number, color: string, size: number, speed: number, name: PlanetName, moons: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const { camera } = useThree()
  const planetTexture = useTexture(`/textures/${name.toLowerCase()}.jpg`)

  useFrame((state, delta) => {
    if (!clicked) {
      const t = state.clock.getElapsedTime()
      ref.current.position.x = Math.cos(t * speed * ORBITAL_PERIOD_SCALE) * orbit
      ref.current.position.z = Math.sin(t * speed * ORBITAL_PERIOD_SCALE) * orbit
      ref.current.rotation.y += delta * 0.5
    }
  })

  const handleClick = () => {
    setClicked(!clicked)
    if (!clicked) {
      camera.position.set(ref.current.position.x, ref.current.position.y + size * 5, ref.current.position.z + size * 5)
      camera.lookAt(ref.current.position)
    } else {
      camera.position.set(0, 20, 25)
      camera.lookAt(0, 0, 0)
    }
  }

  return (
    <group>
      <mesh 
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <sphereGeometry args={[size * 1.02, 32, 32]} />
        <meshStandardMaterial map={planetTexture} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      {hovered && (
        <Html position={[ref.current?.position.x, ref.current?.position.y + size * 1.5, ref.current?.position.z]}>
          <div className="planet-label">{name}</div>
        </Html>
      )}
      {clicked && (
        <Html position={[ref.current?.position.x + size * 3, ref.current?.position.y, ref.current?.position.z]}>
          <div className="planet-info">
            <h3>{name}</h3>
            <p>Mass: {planetData[name].mass}</p>
            <p>Diameter: {planetData[name].diameter}</p>
            <p>Day Length: {planetData[name].dayLength}</p>
            <p>Moons: {moons}</p>
          </div>
        </Html>
      )}
      {Array.from({ length: moons }).map((_, index) => (
        <Moon key={index} planetRef={ref} orbitRadius={size * 2 + index * 0.5} speed={0.5 + index * 0.1} />
      ))}
    </group>
  )
}

function Moon({ planetRef, orbitRadius, speed }: { planetRef: React.RefObject<THREE.Mesh>, orbitRadius: number, speed: number }) {
  const moonRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    moonRef.current.position.x = planetRef.current.position.x + Math.cos(t * speed) * orbitRadius
    moonRef.current.position.z = planetRef.current.position.z + Math.sin(t * speed) * orbitRadius
    moonRef.current.position.y = planetRef.current.position.y
  })

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[0.01, 16, 16]} />
      <meshBasicMaterial color="gray" />
    </mesh>
  )
}

function ControlPanel({ speedMultiplier, setSpeedMultiplier }: { speedMultiplier: number, setSpeedMultiplier: (speed: number) => void }) {
  return (
    <div className="control-panel">
      <h3>Orbit Speed Control</h3>
      <input 
        type="range" 
        min="0.001" 
        max="0.3" 
        step="0.001" 
        value={speedMultiplier} 
        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
      />
      <span>{speedMultiplier.toFixed(3)}x</span>
    </div>
  )
}

function SolarSystem() {
  const [speedMultiplier, setSpeedMultiplier] = useState(0.01)

  return (
    <div className="solar-system">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <Sun />
        <Planet 
          orbit={5} 
          color="#4169E1" 
          size={0.5} 
          speed={EARTH_YEAR * speedMultiplier} 
          name="Earth" 
          moons={1} 
        />
      </Canvas>
    </div>
  )
}

export default SolarSystem