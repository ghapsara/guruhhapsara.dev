import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { useSpring, config } from "react-spring/three"
import { useStaticQuery, graphql } from "gatsby"

import { useBackgroundDispatch } from "../context/background"
import { device } from "../utils/device"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Container from "../components/container"
import Hero from "../components/hero"
import ContentWrapper from "../components/content"

const Title = styled.h1`
  @media ${device.mobileS} {
    font-size: 100px;
  }
  @media ${device.tablet} {
    font-size: 140px;
  }
  margin: 0;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: black;
`

const Span = styled.span`
  -webkit-text-fill-color: black;
`

const Background = styled.div`
  height: 100vh;
  width: 100vw;
  display: grid;
  place-items: center;
`

const Scroll = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  overflow-x: none;
`

const Sticky = styled.div`
  position: sticky;
  top: 0;
`

const TitleWrapper = styled.div`
  margin: 3rem 0;
`

const Content = ({ setHeight }) => {
  const backgroundDispatch = useBackgroundDispatch()

  const ref = useRef()

  const data = useStaticQuery(graphql`
    query {
      markdownRemark(frontmatter: { kind: { eq: "intro" } }) {
        html
      }
    }
  `)

  const content = data.markdownRemark.html

  useEffect(() => {
    backgroundDispatch({ type: "change", color: "transparent" })

    setHeight(ref.current.scrollHeight - window.innerHeight)

    return () => {
      backgroundDispatch({ type: "reset" })
    }
  }, [backgroundDispatch, setHeight])

  return (
    <Container ref={ref}>
      <TitleWrapper>
        <Title>
          <Span>He</Span>
          ll
          <Span>o</Span>
        </Title>
        <Title>I'm</Title>
        <Title>
          <Span>Guruh</Span>.
        </Title>
      </TitleWrapper>
      <ContentWrapper>
        <div
          className="blog-post-content line-numbers"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </ContentWrapper>
    </Container>
  )
}

const IndexPage = () => {
  const [contentHeight, setContentHeight] = useState(0)
  const [{ top }, setSpring] = useSpring(() => ({
    top: 0,
    config: config.molasses,
  }))

  return (
    <>
      <SEO title="Guruh Hapsara" />
      <Background>
        <Hero top={top} contentHeight={contentHeight} />
      </Background>
      <Scroll
        onScroll={e => {
          setSpring({
            top: e.target.scrollTop,
          })
        }}
      >
        <Sticky />
        <Layout>
          <Content setHeight={setContentHeight} />
        </Layout>
      </Scroll>
    </>
  )
}

export default IndexPage
