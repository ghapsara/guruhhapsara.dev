import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { useSpring, config } from "react-spring/three"
import { useStaticQuery, graphql } from "gatsby"

import { useBackgroundDispatch } from "../context/background"
import { device } from "../utils/device"
import { colors } from "../utils/colors"

import { shuffle } from "canvas-sketch-util/random"
import * as chroma from "chroma-js"

import Layout from "../components/layout"
import SEO from "../components/seo"
import ContainerComp from "../components/container"
import Hero from "../components/hero"
import ContentComp from "../components/content"
import { Tag as TagComp, Item } from "../components/home/item"
import Link from "../components/link"

const Container = styled(ContainerComp)`
  max-width: 60rem;
`

const Intro = styled(ContentComp)`
  margin-bottom: 1.5rem;
`

const TitleWrapper = styled.div`
  margin: 1.9rem 0;
`

const Tag = styled(TagComp)`
  display: inline-block;
  font-size: 0.9em;
  margin-bottom: 1.5rem;
  padding: 0.3em 0.9em;
  background: black;
  color: white;
`

const Title = styled.h1`
  @media ${device.mobileS} {
    font-size: 87px;
  }
  @media ${device.tablet} {
    font-size: 170px;
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

const Content = () => {
  const backgroundDispatch = useBackgroundDispatch()

  const {
    allMarkdownRemark: posts,
    allProjectsJson: projects,
    markdownRemark: intro,
  } = useStaticQuery(graphql`
    query {
      allMarkdownRemark(filter: { frontmatter: { published: { eq: true } } }) {
        edges {
          node {
            frontmatter {
              kind
              url: path
              description
              date
              dateString: date(formatString: "MMMM DD, YYYY")
              title
            }
          }
        }
      }
      allProjectsJson {
        edges {
          node {
            kind
            description
            date
            dateString: date(formatString: "MMMM DD, YYYY")
            links {
              url
            }
            title: name
          }
        }
      }

      markdownRemark(frontmatter: { kind: { eq: "intro" } }) {
        html
      }
    }
  `)

  const content = intro.html

  const palletes = shuffle(colors).map(d => chroma(d).alpha(0.8))
  const lenPalletes = palletes.length

  const data = [
    ...posts.edges.map(({ node: { frontmatter: d } }) => ({ ...d })),
    ...projects.edges.map(({ node }) => ({ ...node, url: node.links[0].url })),
  ]
    .map((d, i) => ({ ...d, color: palletes[i % lenPalletes] }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  useEffect(() => {
    backgroundDispatch({ type: "change", color: "transparent" })

    return () => {
      backgroundDispatch({ type: "reset" })
    }
  }, [backgroundDispatch])

  return (
    <Container>
      <TitleWrapper>
        Hello, I'm
        <Title>
          <Span>G</Span>u<Span>ruh</Span>
        </Title>
        <Title>
          <Span>Hap</Span>s<Span>ar</Span>a
        </Title>
      </TitleWrapper>
      <Intro>
        <div
          className="blog-post-content line-numbers"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Intro>
      <Tag>feeds</Tag>
      {data.map(d => (
        <Link key={d.url} href={d.url}>
          <Item {...d}></Item>
        </Link>
      ))}
    </Container>
  )
}

const IndexPage = () => {
  const [contentHeight, setHeight] = useState(0)
  const [{ top }, setSpring] = useSpring(() => ({
    top: 0,
    config: config.molasses,
  }))

  useEffect(() => {
    setHeight(window.innerHeight)
  }, [setHeight])

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
          <Content />
        </Layout>
      </Scroll>
    </>
  )
}

export default IndexPage
