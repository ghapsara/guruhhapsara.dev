import React from "react"
import styled from "styled-components"

const Container = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  padding: 1.8em 1.5em;
  background-color: white;
  border-radius: 28px;
  background: ${props => props.background};
  cursor: pointer;
`

const Title = styled.h1``

const Description = styled.p`
  margin-bottom: 0;
  padding: 2px;
  border-radius: 12px;
  display: table;
`

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 7px;
  align-items: center;
  margin-bottom: 0.4em;
`

export const Tag = styled.div`
  background-color: rgba(245, 245, 247, 0.6);
  padding: 0.1em 0.7em;
  font-size: 0.7em;
  border-radius: 12px;
  min-width: 45px;
  text-align: center;
`

const Date = styled.div``

export function Item({ title, kind = "post", color, dateString }) {
  return (
    <Container background={color}>
      <Wrapper>
        <Tag>{kind}</Tag>
        <Date>{dateString}</Date>
      </Wrapper>
      <Title>{title}</Title>
      <Description>{}</Description>
    </Container>
  )
}

export default Item
