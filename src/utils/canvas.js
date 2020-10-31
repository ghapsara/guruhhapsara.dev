export function getPixelRatio() {
  // const canvas = document.createElement('canvas');
  // const ctx = canvas.getContext('2d');
  // const dpr = window.devicePixelRatio || 1;
  // const bsr = ctx.webkitBackingStorePixelRatio ||
  //   ctx.mozBackingStorePixelRatio ||
  //   ctx.msBackingStorePixelRatio ||
  //   ctx.oBackingStorePixelRatio ||
  //   ctx.backingStorePixelRatio || 1;

  return 1
}

export function createCanvas(width, height) {
  const dpr = getPixelRatio()

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  context.scale(dpr, dpr)

  return [canvas, context]
}

export default {
  getPixelRatio,
  createCanvas,
}
