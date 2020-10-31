import React, { useRef, useMemo, useEffect } from "react"
import { useThree, useFrame, extend } from "react-three-fiber"
import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
import { TexturePass } from "three/examples/jsm/postprocessing/TexturePass"
import { ClearPass } from "three/examples/jsm/postprocessing/ClearPass"
import {
  ClearMaskPass,
  MaskPass,
} from "three/examples/jsm/postprocessing/MaskPass"
import { CopyShader } from "three/examples/jsm/shaders/CopyShader"
import { interpolateRainbow } from "d3-scale-chromatic"

import { createCanvas, getPixelRatio } from "../../utils/canvas"

extend({
  EffectComposer,
  ShaderPass,
  ClearPass,
  TexturePass,
  MaskPass,
  ClearMaskPass,
  RenderPass,
})

function Background({ sceneRefs }) {
  const {
    gl,
    camera,
    size: { width, height },
  } = useThree()
  const composer = useRef()

  const dpr = getPixelRatio()
  const w = width * dpr
  const h = height * dpr

  const [texture, ctx] = useMemo(() => {
    const [canvas, ctx] = createCanvas(width, height)

    const t = new THREE.CanvasTexture(canvas)
    t.minFilter = THREE.LinearFilter
    return [t, ctx]
  }, [height, width])

  const renderTarget = useMemo(() => {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: true,
    })
  }, [w, h])

  useEffect(() => {
    composer.current.setSize(w, h)
  }, [w, h])

  useFrame(({ camera, clock }) => {
    ctx.clearRect(0, 0, width, height)

    const t = Math.abs(Math.sin(clock.elapsedTime / 10))
    const color = interpolateRainbow(t)

    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    texture.needsUpdate = true

    camera.layers.set(1)
    gl.autoClear = false
    gl.clear()
    composer.current.render()

    camera.layers.set(0)
    gl.clearDepth()
  })

  return (
    <>
      <effectComposer ref={composer} args={[gl, renderTarget]}>
        <clearPass attachArray="passes" />
        <maskPass attachArray="passes" args={[sceneRefs.current, camera]} />
        <texturePass attachArray="passes" args={[texture]} />
        <clearMaskPass attachArray="passes" />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
    </>
  )
}

export default Background
