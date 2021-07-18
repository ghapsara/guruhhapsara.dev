import React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Container from "../components/container"
import SEO from "../components/seo"
import Header from "../components/note/item"
import Link from "../components/link"

export const pageQuery = graphql`
  query {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { published: { eq: true } } }
    ) {
      edges {
        node {
          frontmatter {
            date: date(formatString: "MMMM DD, YYYY")
            title
            tags
            path
            description
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
      }
    }
  }
`

function NotesPage({ data }) {
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout>
      <SEO title="Notes" />
      <Container>
        {posts.map(({ node: { frontmatter: d } }, i) => {
          return (
            <Link key={d.path} href={d.path}>
              <Header
                title={d.title}
                date={d.date}
                description={d.description}
                cover={d.cover}
                coverAuthor={d.coverAuthor}
                coverUrl={d.coverUrl}
              />
            </Link>
          )
        })}
      </Container>
    </Layout>
  )
}

export default NotesPage
