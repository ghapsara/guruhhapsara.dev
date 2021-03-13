import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import styled from "styled-components"

import Layout from "../components/layout"
import Container from "../components/container"
import SEO from "../components/seo"
import Header from "../components/note/item"

const Link = styled.a`
  text-decoration: none;
  color: black;
`

export const pageQuery = graphql`
  query {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { kind: { eq: "post" }, published: { eq: true } } }
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
        {posts.length === 0 && (
          <h5>
            notes come soon, stay tuned <span role="img">👌</span>
          </h5>
        )}
      </Container>
    </Layout>
  )
}

export default NotesPage
