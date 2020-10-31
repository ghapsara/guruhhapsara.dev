import { useThree } from "react-three-fiber"

export function usePosition() {
  const {
    viewport: { width, height },
  } = useThree()

  const x = width / 2
  const y = height / 2

  const topLeft = [-x, y, 0]
  const bottomLeft = [-x, -y, 0]
  const topRight = [x, y, 0]
  const bottomRight = [x, -y, 0]

  return {
    x,
    y,
    width,
    height,
    topLeft,
    bottomLeft,
    topRight,
    bottomRight,
  }
}

export default {
  usePosition,
}
