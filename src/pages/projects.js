import React, { useState, useRef, useEffect, useCallback } from "react"
import { useStaticQuery, graphql } from "gatsby"
import { animated, useSpring } from "react-spring"
import random from "canvas-sketch-util/random"

import { isMobile } from "../utils/device"
import { colors } from "../utils/colors"

import Layout from "../components/layout"
import SEO from "../components/seo"
import {
  HEIGHT,
  Wrapper,
  Container,
  Content,
  Media,
  Img,
  Caption,
  Title,
  Description,
  Links,
  Link,
  Background,
  Name,
} from "../components/project"

const Item = ({ id, links, isPortrait, media, name, description }) => {
  const mediaUrl = `../../${media}`
  const [isHovered, setIsHovered] = useState(false)
  const [height, setHeight] = useState(0)

  const ref = useRef(null)

  const hover = useCallback(() => {
    if (!isMobile(window.innerWidth)) {
      setIsHovered(!isHovered)
    }
  }, [setIsHovered, isHovered])

  const click = useCallback(() => {
    if (isMobile(window.innerWidth)) {
      setIsHovered(!isHovered)
    }
  }, [setIsHovered, isHovered])

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
      onClick={click}
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
              <Link key={`${id}-${i}`} href={d.url} target="_blank">
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

  const projects = data.allProjectsJson.edges.map(({ node }) => ({ ...node }))

  return (
    <Layout>
      <SEO title="Projects" />
      <Wrapper>
        <Container>
          {projects.map(d => {
            return <Item key={d.name} {...d} />
          })}
        </Container>
      </Wrapper>
    </Layout>
  )
}

export default ProjectsPage
