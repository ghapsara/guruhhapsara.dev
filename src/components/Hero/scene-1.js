import React, { useRef, useMemo } from "react"
import { useFrame, extend } from "react-three-fiber"
import { MeshLine, MeshLineMaterial } from "threejs-meshline"
import random from "canvas-sketch-util/random"

import { colors } from "../../utils/colors"
import { usePosition } from "../../utils/three"
import { CatmullRomCurve3, Vector3 } from "three"
import { linspace, mapRange } from "canvas-sketch-util/math"

extend({
  MeshLine,
  MeshLineMaterial,
})

function Fatline({ curve, color }) {
  const material = useRef()
  const speed = random.range(0.0005, 0.001)

  useFrame(() => (material.current.uniforms.dashOffset.value -= speed))

  return (
    <mesh>
      <meshLine attach="geometry" vertices={curve} />
      <meshLineMaterial
        attach="material"
        ref={material}
        transparent
        depthTest={false}
        lineWidth={5}
        color={color}
        dashArray={0.3}
        dashRatio={0.9}
      />
    </mesh>
  )
}

function Lines() {
  const { x, topLeft, bottomRight } = usePosition()

  const [x1, y1] = topLeft
  const [x2, y2] = bottomRight

  const lines = useMemo(() => {
    return new Array(3).fill().map((_, key) => {
      return {
        key,
        line: new CatmullRomCurve3(
          linspace(Math.ceil(random.range(3, 7)), true).map(d => {
            const x = mapRange(
              d,
              0,
              1,
              x1 * random.gaussian(),
              x2 * random.gaussian()
            )
            const y = mapRange(
              d,
              0,
              1,
              y1 * random.gaussian(),
              y2 * random.gaussian()
            )

            return new Vector3(x, y, 0)
          })
        ).getPoints(150),
        position: [random.range(x1, x2), random.range(y1 / 2, y2 / 2), 0],
      }
    })
  }, [x1, x2, y1, y2])

  const boxRef = useRef()

  useFrame(() => {
    boxRef.current.rotation.z += 0.01
    boxRef.current.rotation.y += 0.01
  })

  return (
    <>
      <mesh
        ref={boxRef}
        position={[0.5 * x, 0, 0]}
        scale={[200, 200, 200]}
        layers={1}
      >
        <boxBufferGeometry attach="geometry" args={[1, 0.4, 1]} />
        <meshBasicMaterial attach="material" color={colors[3]} />
      </mesh>
      {lines.map(({ key, line, position }) => (
        <group key={key} position={position}>
          <Fatline key={key} curve={line} color={random.pick(colors)} />
        </group>
      ))}
    </>
  )
}

export default Lines
