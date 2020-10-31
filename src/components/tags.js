import React from "react"
import styled from "styled-components"
import { shuffle } from "canvas-sketch-util/random"
import {} from "canvas-sketch-util/math"

import colors from "../utils/colors"

const Container = styled.div`
  display: flex;
  grid-template-columns: repeat(auto-fit, minmax(max-content, 1fr));
  grid-gap: 12px;
  margin-bottom: 20px;
`

const Pill = styled.div`
  border-radius: 28px;
  padding: 0.6em 1.2em;
  margin: 0;
  text-align: center;
  font-size: 0.9em;
  /* font-weight: bold; */
  /* color: ${props => props.color && "white"}; */
  background-color: ${props => props.color};
`

function Tags({ data }) {
  const length = data.length

  return (
    <Container length={length}>
      {data.sort().map((d, i) => (
        <Pill key={d} color={colors[i % length]}>
          {d}
        </Pill>
      ))}
    </Container>
  )
}

export default Tags
