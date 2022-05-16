import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Container from "../components/container"
import Header from "../components/post/header"
import Content from "../components/content"
import Share from "../components/share"
import Background from "../components/background"

export default function Template({ data }) {
  const {
    frontmatter: {
      date,
      title,
      background,
      color,
      description,
      path,
      tags,
      cover,
      coverAuthor,
      coverUrl,
    },
    html,
  } = data.markdownRemark

  const { siteUrl } = data.site.siteMetadata

  const postUrl = `${siteUrl}${path}`
  const image = !!cover ? `${siteUrl}${cover.childImageSharp.fluid.src}` : ""
  const keywords = tags.join(", ")

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        image={image}
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
