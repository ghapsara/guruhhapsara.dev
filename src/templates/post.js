import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Container from "../components/container"
import Header from "../components/post/header"
import Content from "../components/content"
import Line from "../components/line"
import Background from "../components/background"

export default function Template({ data }) {
  const {
    frontmatter: {
      date,
      title,
      background,
      color,
      description,
      tags,
      cover,
      coverAuthor,
      coverUrl,
    },
    html,
  } = data.markdownRemark

  const { siteUrl } = data.site.siteMetadata

  const keywords = tags.join(", ")
  let meta = []

  if (cover) {
    meta = [
      ...meta,
      {
        property: `og:image`,
        content: `${siteUrl}${cover.childImageSharp.fluid.src}`,
      },
    ]
  }

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        meta={meta}
      />
      <Layout>
        <Background color={background} />
        <Header
          title={title}
          date={date}
          description={description}
          cover={cover}
          coverAuthor={coverAuthor}
          coverUrl={coverUrl}
        />
        <Container>
          <Content color={color}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Content>
          <Line />
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
        color
        coverAuthor
        coverUrl
        cover {
          childImageSharp {
            fluid(maxWidth: 1200) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
