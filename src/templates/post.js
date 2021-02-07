import React, { useEffect } from "react"
import { graphql } from "gatsby"

import { useBackgroundDispatch } from "../context/background"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Container from "../components/container"
import Header from "../components/article-header"
import Content from "../components/content"
import Share from "../components/share"

const Background = ({ color }) => {
  const backgroundDispatch = useBackgroundDispatch()

  useEffect(() => {
    if (!!color) {
      backgroundDispatch({ type: "change", color: color })
    }
    return () => {
      backgroundDispatch({ type: "reset" })
    }
  }, [color, backgroundDispatch])

  return <></>
}

export default function Template({ data }) {
  const {
    frontmatter: { date, title, background, description, cover, path },
    html,
  } = data.markdownRemark

  const postUrl = `https://guruhhapsara.dev${path}`

  return (
    <>
      <SEO title={title} description={description} />
      <Layout>
        <Background color={background} />
        <Container>
          <Header
            title={title}
            date={date}
            description={description}
            cover={cover}
          />
          <Content>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Content>
          <Share postUrl={postUrl} />
        </Container>
      </Layout>
    </>
  )
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
        tags
        background
        description
        cover {
          childImageSharp {
            fluid(maxWidth: 1200) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
  }
`
