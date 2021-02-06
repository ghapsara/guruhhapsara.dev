import React from "react"
import styled from "styled-components"

const Container = styled.div`
  background-color: white;
  border-radius: 28px;
  position: relative;
  margin: 3em 0em;
`

const Date = styled.p`
  margin-bottom: 0.4em;
`

const Title = styled.h1``

const Description = styled.p`
  margin: 0;
`

const Wrapper = styled.div`
  padding: 3em 5em;
`

function ArticleHeader({ title, description, date }) {
  return (
    <Container>
      <Wrapper>
        <Date>{date}</Date>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Wrapper>
    </Container>
  )
}

export default ArticleHeader
