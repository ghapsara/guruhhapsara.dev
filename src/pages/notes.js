import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import styled from "styled-components"

import Layout from "../components/layout"
import Container from "../components/container"
import SEO from "../components/seo"

const Post = styled.div`
  margin-bottom: 1rem;
  border-radius: 28px;
  background-color: white;
`

const Cover = styled(Image)`
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  margin-bottom: 0.8rem;
`

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: 0.5;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
`

const Link = styled.a`
  text-decoration: none;
  color: black;
`

const Header = styled.div`
  position: relative;
  margin-bottom: 0.8rem;
`

const Wrapper = styled.div`
  position: ${props => (props.hasCover ? "absolute" : "relative")};
  bottom: 0;
  left: 0;
  padding: ${props => (props.hasCover ? "0rem 1.2rem" : "1.2rem 1.2rem 0rem")};
  color: ${props => (props.hasCover ? "white" : "black")};
`

const Title = styled.h1`
  margin-bottom: 0.5rem;
`

const Date = styled.p`
  margin: 0;
  margin-bottom: 0.8rem;
`

const Description = styled.p`
  margin-bottom: 0;
  padding: 0 1.2rem 1.2rem;
`

function NotesPage() {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: DESC }
        filter: {
          frontmatter: { kind: { eq: "post" }, published: { eq: true } }
        }
      ) {
        edges {
          node {
            frontmatter {
              date: date(formatString: "MMMM DD, YYYY")
              title
              tags
              path
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
      }
    }
  `)

  const posts = data.allMarkdownRemark.edges

  return (
    <Layout>
      <SEO title="Notes" />
      <Container>
        {posts.map(({ node: { frontmatter: d } }, i) => {
          return (
            <Link key={d.path} href={d.path}>
              <Post>
                <Header>
                  {!!d.cover && (
                    <>
                      <Cover fluid={d.cover.childImageSharp.fluid} />
                      <Background />
                    </>
                  )}
                  <Wrapper hasCover={!!d.cover}>
                    <Title>{d.title}</Title>
                    <Date>{d.date}</Date>
                  </Wrapper>
                </Header>
                <Description>{d.description}</Description>
              </Post>
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
