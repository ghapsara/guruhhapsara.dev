import React, { useRef } from "react"
import { useFrame } from "react-three-fiber"

import { usePosition } from "../../utils/three"

function Scene() {
  const { x, y } = usePosition()

  const sphereRef = useRef()

  useFrame(() => {
    sphereRef.current.rotation.x -= 0.002
    sphereRef.current.rotation.y -= 0.004
    sphereRef.current.rotation.z += 0.003
  })

  const scale = [80, 80, 80]

  return (
    <mesh
      layers={1}
      ref={sphereRef}
      position={[-x * 0.7, 0.5 * -y, 0]}
      scale={scale}
    >
      <octahedronBufferGeometry attach="geometry" args={[2, 2]} />
      <meshBasicMaterial attach="material" color="hotpink" wireframe />
    </mesh>
  )
}

export default Scene
