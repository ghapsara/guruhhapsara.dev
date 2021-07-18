import React, { useState, useRef, useEffect } from "react"
import { Canvas } from "react-three-fiber"
import { a } from "react-spring/three"
import { mapRange } from "canvas-sketch-util/math"

import { getPixelRatio } from "../../utils/canvas"

import Background from "./background"
import Scene1 from "./scene-1"
import Scene2 from "./scene-2"
import Scene3 from "./scene-3"

function Container({ top, contentHeight }) {
  const sceneRef = useRef()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (sceneRef.current != null) {
      setIsReady(true)
    }
  }, [sceneRef])

  const components = [
    { component: Scene1, name: "scene-1" },
    { component: Scene2, name: "scene-2" },
    { component: Scene3, name: "scene-3" },
  ]

  const scenes = components.map((d, i) => {
    let y = mapRange(i, 0, components.length - 1, 0, contentHeight)

    return {
      ...d,
      y: -y,
    }
  })

  return (
    <>
      <scene ref={sceneRef} dispose={null}>
        <a.group
          position={top.interpolate(t => {
            return [0, t, 0]
          })}
        >
          {scenes.map(c => {
            return (
              <group key={c.name} position={[0, c.y, 0]}>
                <c.component key={c.name} />
              </group>
            )
          })}
        </a.group>
      </scene>
      {isReady && <Background sceneRefs={sceneRef} />}
    </>
  )
}

function Hero({ top, contentHeight }) {
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
  }, [setWidth, setHeight])

  return (
    <Canvas
      orthographic
      camera={{
        left: -width / 2,
        right: width / 2,
        top: height / 2,
        bottom: -height / 2,
        near: 1,
        far: 1000,
        position: [0, 0, 500],
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("white")
      }}
      pixelRatio={getPixelRatio()}
    >
      <Container top={top} contentHeight={contentHeight} />
    </Canvas>
  )
}

export default Hero
