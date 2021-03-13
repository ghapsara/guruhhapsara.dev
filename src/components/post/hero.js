import React from "react"
import styled from "styled-components"
import Image from "gatsby-image"

const Container = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`
const Wrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 1.2rem;
  color: white;
  padding: 0.4rem 5.8rem;
`

const Cover = styled(Image)`
  height: ${window.innerHeight * 0.91}px;
`

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: 0.6;
`

const Title = styled.h1`
  font-size: 50px;
`

const Description = styled.p`
  max-width: 50%;
`

const Date = styled.p`
  margin-bottom: 0.4em;
`

const Credit = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.3rem;
  a {
    color: #d0d0d0;
  }
`

function Hero({ title, description, date, cover, coverAuthor, coverUrl }) {
  return (
    <Container>
      <Cover fluid={cover.childImageSharp.fluid} />
      <Background />
      <Wrapper>
        <Date>{date}</Date>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <Credit>
          <small>
            Photo by <a href={coverUrl}>{coverAuthor}</a> on{" "}
            <a href="https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">
              Unsplash
            </a>
          </small>
        </Credit>
      </Wrapper>
    </Container>
  )
}

export default Hero
