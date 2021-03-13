import React, { useRef } from "react"
import { useFrame } from "react-three-fiber"

import { usePosition } from "../../utils/three"

function Scene() {
  const { x, y } = usePosition()

  const sphereRef = useRef()
  const groupRef = useRef()
  const triangle0Ref = useRef()
  const triangle1Ref = useRef()
  const box0Ref = useRef()
  const box1Ref = useRef()

  useFrame(() => {
    sphereRef.current.rotation.x -= 0.002
    sphereRef.current.rotation.y -= 0.004
    sphereRef.current.rotation.z += 0.003

    // triangle0Ref.current.rotation.x += 0.002;
    // triangle0Ref.current.rotation.y -= 0.009;
    triangle0Ref.current.rotation.z += 0.03

    // triangle1Ref.current.rotation.x -= 0.03;
    // triangle1Ref.current.rotation.y -= 0.003;
    triangle1Ref.current.rotation.z -= 0.008

    box0Ref.current.rotation.x -= 0.03
    box0Ref.current.rotation.y -= 0.003
    box0Ref.current.rotation.z += 0.003

    box1Ref.current.rotation.x -= 0.03
    box1Ref.current.rotation.y -= 0.003
    box1Ref.current.rotation.z += 0.003

    groupRef.current.rotation.z -= 0.01
  })

  const scale = [80, 80, 80]

  return (
    <>
      <group position={[x * 0.95, -y * 0.9, 0]} ref={groupRef}>
        <mesh
          scale={scale}
          layers={1}
          ref={triangle0Ref}
          position={[x * -0.4, 0, 0]}
        >
          <circleBufferGeometry attach="geometry" args={[1, 3]} />
          <meshBasicMaterial attach="material" />
        </mesh>
        <mesh
          scale={scale}
          layers={1}
          ref={triangle1Ref}
          position={[x * 0.4, 0, 0]}
        >
          <circleBufferGeometry attach="geometry" args={[1, 3]} />
          <meshBasicMaterial attach="material" />
        </mesh>
        <mesh scale={scale} layers={1} ref={box0Ref} position={[0, y * 0.6, 0]}>
          <boxBufferGeometry attach="geometry" args={[1, 2]} />
          <meshBasicMaterial attach="material" />
        </mesh>
        <mesh
          scale={scale}
          layers={1}
          ref={box1Ref}
          position={[0, y * -0.6, 0]}
        >
          <boxBufferGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial attach="material" />
        </mesh>
      </group>
      <mesh layers={1} ref={sphereRef} position={[-x, -y, 0]} scale={scale}>
        <octahedronBufferGeometry attach="geometry" args={[2, 2]} />
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
      </mesh>
    </>
  )
}

export default Scene
