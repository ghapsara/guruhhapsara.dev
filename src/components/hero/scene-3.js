import React, { useRef } from "react"
import { useFrame } from "react-three-fiber"

import { usePosition } from "../../utils/three"

function Scene() {
  const { x, y } = usePosition()

  const groupRef = useRef()
  const triangleRef = useRef()
  const boxRef = useRef()

  useFrame(() => {
    triangleRef.current.rotation.z += 0.07

    boxRef.current.rotation.x -= 0.03
    boxRef.current.rotation.y -= 0.003
    boxRef.current.rotation.z += 0.003

    groupRef.current.rotation.z -= 0.01
  })

  const scale = [80, 80, 80]

  return (
    <group position={[x * 0.5, -y * 1.3, 0]} ref={groupRef}>
      <mesh
        scale={scale}
        layers={1}
        ref={triangleRef}
        position={[x * 0.3, 0, 0]}
      >
        <circleBufferGeometry attach="geometry" args={[1, 3]} />
        <meshBasicMaterial attach="material" wireframe />
      </mesh>
      <mesh scale={scale} layers={1} ref={boxRef} position={[x * -0.3, 0, 0]}>
        <boxBufferGeometry attach="geometry" args={[1, 2]} />
        <meshBasicMaterial attach="material" />
      </mesh>
    </group>
  )
}

export default Scene
