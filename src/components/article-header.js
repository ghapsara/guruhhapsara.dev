import React from "react"
import styled from "styled-components"
import Image from "gatsby-image"

const Container = styled.div`
  background-color: white;
  border-radius: 28px;
  position: relative;
  margin: 3rem 0em;
`
const Wrapper = styled.div`
  position: ${props => (props.hasCover ? "absolute" : "relative")};
  bottom: 0;
  left: 0;
  padding: ${props => (props.hasCover ? "0rem 1.2rem" : "1.2rem 1.2rem 0rem")};
  color: ${props => (props.hasCover ? "white" : "black")};
  padding: 1.5em 1.8em 0;
`

const Header = styled.div`
  position: relative;
  margin-bottom: 0.8rem;
`

const Cover = styled(Image)`
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  margin-bottom: 0.8rem;
`
const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: 0.5;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
`

const Title = styled.h1``

const Description = styled.p`
  margin-bottom: 0;
  padding: 0 1.8em 1.5em;
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

function ArticleHeader({
  title,
  description,
  date,
  cover,
  coverAuthor,
  coverUrl,
}) {
  return (
    <Container>
      <Header>
        {!!cover && (
          <>
            <Cover fluid={cover.childImageSharp.fluid} />
            <Background />
          </>
        )}
        <Wrapper hasCover={!!cover}>
          <Date>{date}</Date>
          <Title>{title}</Title>
          {!!cover && (
            <Credit>
              <small>
                Photo by <a href={coverUrl}>{coverAuthor}</a> on{" "}
                <a href="https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">
                  Unsplash
                </a>
              </small>
            </Credit>
          )}
        </Wrapper>
      </Header>
      <Description>{description}</Description>
    </Container>
  )
}

export default ArticleHeader
