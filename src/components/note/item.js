import React from "react"
import styled from "styled-components"

const Container = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  padding: ${props => (props.compact ? "1.8em 1.5em" : "3em")};
  background-color: white;
  border-radius: 28px;
`

const Title = styled.h1``

const Description = styled.p`
  margin-bottom: 0;
`

const Date = styled.p`
  margin-bottom: 0.4em;
`

function Item({ title, description, date, compact = true }) {
  const totalChar = 180
  const shouldTrim = (description.length > totalChar) & compact
  const desc = shouldTrim
    ? `${description.substr(0, totalChar)}...`
    : description
  return (
    <Container compact={compact}>
      <Date>{date}</Date>
      <Title>{title}</Title>
      <Description>{desc}</Description>
    </Container>
  )
}

export default Item
