import React, { useState, useRef, useEffect, useCallback } from "react"
import { useStaticQuery, graphql } from "gatsby"
import styled from "styled-components"
import { animated, useSpring } from "react-spring"

import { device } from "../utils/device"
import { colors } from "../utils/colors"

import Layout from "../components/layout"
import SEO from "../components/SEO"
import random from "canvas-sketch-util/random"

const WIDTH = 1440
const HEIGHT = 0.75 * 798

const Wrapper = styled.div`
  margin: 0 auto;
  padding: 0 1.0875rem 1.45rem;
  @media ${device.mobileS} {
    max-width: ${device.mobileS};
  }
  @media ${device.mobileS} {
    max-width: ${0.8 * WIDTH}px;
  }
`

const Container = styled.div`
  display: flex;
  grid-gap: 12px;
  @media ${device.mobileS} {
    flex-direction: column;
  }
  @media ${device.laptop} {
    flex-direction: row;
    flex-wrap: wrap;
  }
`

const Content = styled.div`
  @media ${device.mobileS} {
    width: ${device.mobileS};
    margin-bottom: 12px;
  }
  @media ${device.laptop} {
    width: ${props => (props.isPortrait ? 0.25 * WIDTH : 0.5 * WIDTH)}px;
  }
  background-color: white;
  border-radius: 28px;
  position: relative;
  color: black;
  text-decoration: none;
  box-shadow: 0 0 0 0;
  display: grid;
  grid-template-rows: ${0.8 * HEIGHT}px ${0.2 * HEIGHT}px;
  position: relative;
  overflow: hidden;
`

const Media = styled.div`
  height: ${0.8 * HEIGHT}px;
`

const Img = styled.img`
  object-fit: cover;
  height: 100%;
  width: 100%;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  margin: 0;
`

const Caption = styled(animated.div)`
  padding: 20px 30px;
  border-radius: 28px;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  background: white;
  min-height: ${HEIGHT * 0.5}px;
`

const Title = styled.h3`
  margin-bottom: 5px;
`

const Description = styled.p`
  margin: 0;
  margin-bottom: 25px;
`

const Links = styled.div`
  display: flex;
`

const Link = styled.a`
  color: black;
  font-size: 0.9em;
  margin-right: 5px;
`

const Background = styled.div`
  height: ${HEIGHT * 0.8}px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  border-radius: 28px;
  background-color: ${props => props.color};
`

const Name = styled.h2`
  position: absolute;
  padding: 30px;
  color: white;
`

const Item = ({ id, links, isPortrait, media, name, description }) => {
  const mediaUrl = `../../${media}`
  const [isHovered, setIsHovered] = useState(false)
  const [height, setHeight] = useState(0)
  const ref = useRef(null)

  const hover = useCallback(() => {
    setIsHovered(!isHovered);
  }, [setIsHovered, isHovered]);

  const style = useSpring({
    height: isHovered ? height : HEIGHT * 0.2,
  })

  const backgroundStyle = useSpring({
    backgroundColor: isHovered ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0)",
  })

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.clientHeight)
    }
    return () => {
      setHeight(0)
    }
  }, [id])

  return (
    <Content
      isPortrait={isPortrait}
      onMouseEnter={hover}
      onMouseLeave={hover}
    >
      <Background color={!media ? random.pick(colors) : "transparent"}>
        {!media && <Name>{name}</Name>}
        <animated.div
          style={{ width: "100%", height: "100%", ...backgroundStyle }}
        />
      </Background>
      {media && (
        <Media>
          <Img src={mediaUrl} />
        </Media>
      )}
      <animated.div style={{ position: "absolute", bottom: 0, ...style }}>
        <Caption ref={ref}>
          <Title>{name}</Title>
          <Description>{description}</Description>
          <Links>
            {links.map((d, i) => (
              <Link key={`${id}-${i}`} href={d.url}>
                {d.text}
              </Link>
            ))}
          </Links>
        </Caption>
      </animated.div>
    </Content>
  )
}

function ProjectsPage() {
  const data = useStaticQuery(graphql`
    query {
      allProjectsJson {
        edges {
          node {
            name
            description
            media
            isPortrait
            links {
              url
              text
            }
          }
        }
      }
    }
  `)

  const projects = data.allProjectsJson.edges.map(({ node }, i) => ({
    ...node,
    id: i,
  }))

  return (
    <Layout>
      <SEO title="Projects" />
      <Wrapper>
        <Container>
          {projects.map(d => {
            return <Item key={d.id} {...d} />
          })}
        </Container>
      </Wrapper>
    </Layout>
  )
}

export default ProjectsPage
