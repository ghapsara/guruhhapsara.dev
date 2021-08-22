import React, { useState, useEffect } from "react"
import { useSpring, config } from "react-spring/three"
import { useStaticQuery, graphql } from "gatsby"

import { useBackgroundDispatch } from "../context/background"
import { colors } from "../utils/colors"

import { shuffle } from "canvas-sketch-util/random"
import * as chroma from "chroma-js"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Hero from "../components/hero"
import { Item } from "../components/home/item"
import Link from "../components/link"
import {
  Container,
  Intro,
  TitleWrapper,
  Tag,
  Title,
  Span,
  Background,
  Scroll,
  Sticky,
} from "../components/home"

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
          <Span>
            Guruh
            <br />
            Hapsara
          </Span>
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
