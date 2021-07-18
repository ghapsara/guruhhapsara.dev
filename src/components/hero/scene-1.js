import React, { useRef } from "react"
import { useFrame } from "react-three-fiber"

import { colors } from "../../utils/colors"
import { usePosition } from "../../utils/three"

function Lines() {
  const { x, y } = usePosition()

  const boxRef = useRef()

  useFrame(() => {
    boxRef.current.rotation.z += 0.01
    boxRef.current.rotation.y += 0.01
  })

  return (
    <>
      <mesh
        ref={boxRef}
        position={[0.4 * x, 0.3 * y, 0]}
        scale={[200, 200, 200]}
        layers={1}
      >
        <boxBufferGeometry attach="geometry" args={[1, 0.4, 1]} />
        <meshBasicMaterial attach="material" color={colors[3]} />
      </mesh>
    </>
  )
}

export default Lines
