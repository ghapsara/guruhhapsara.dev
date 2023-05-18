import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"
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
  width: 100%;
  padding: 1.2rem;
  color: white;
  padding: 0.4rem 5.8rem;
`

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: ${props => props.coverOpacity};
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

const defaultCoverSourceLink =
  "https://unsplash.com/?utm_source=guruhhapsara.dev&utm_medium=referral&utm_content=creditCopyText"
const defaultCoverSourcePlatform = "Unsplash"
const defaultCoverOpacity = 0.6

function Hero({
  title,
  description,
  date,
  cover,
  coverAuthor,
  coverUrl,
  coverSourceLink,
  coverSourcePlatform,
  coverOpacity,
}) {
  const [coverHeight, setCoverHeight] = useState(500)
  useEffect(() => {
    setCoverHeight(window.innerHeight - 70)
  }, [setCoverHeight])

  return (
    <Container>
      <Image
        fluid={cover.childImageSharp.fluid}
        style={{
          height: coverHeight,
        }}
      />
      <Background coverOpacity={coverOpacity || defaultCoverOpacity} />
      <Wrapper>
        <Date>{date}</Date>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <Credit>
          <small>
            Photo by <a href={coverUrl}>{coverAuthor}</a> on{" "}
            <a href={coverSourceLink || defaultCoverSourceLink}>
              {coverSourcePlatform || defaultCoverSourcePlatform}
            </a>
          </small>
        </Credit>
      </Wrapper>
    </Container>
  )
}

Hero.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  cover: PropTypes.object.isRequired,
  coverAuthor: PropTypes.string.isRequired,
  coverUrl: PropTypes.string.isRequired,
  coverSourceLink: PropTypes.string,
  coverSourcePlatform: PropTypes.string,
  coverOpacity: PropTypes.number,
}

export default Hero
