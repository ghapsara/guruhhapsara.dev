import React, { useEffect } from "react"
import { useBackgroundDispatch } from "../context/background"

const Background = ({ color }) => {
  const backgroundDispatch = useBackgroundDispatch()

  useEffect(() => {
    if (!!color) {
      backgroundDispatch({ type: "change", color: color })
    }
    return () => {
      backgroundDispatch({ type: "reset" })
    }
  }, [color, backgroundDispatch])

  return <></>
}

export default Background
