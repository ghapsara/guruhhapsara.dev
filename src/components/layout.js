import React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import styled from "styled-components"

import { BackgroundProvider, useBackgroundState } from "../context/background"

import Header from "./header"
import "./layout.css"
import Footer from "./footer"

const Container = styled.div`
  background: ${props => props.background};
  display: grid;
  grid-template-rows: 70px minmax(calc(100vh - 190px), 1fr) 120px;
`

const Content = ({ children }) => {
  const { color } = useBackgroundState()

  return <Container background={color}>{children}</Container>
}

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <BackgroundProvider>
      <Content>
        <Header siteTitle={data.site.siteMetadata.title} />
        <main>{children}</main>
        <Footer />
      </Content>
    </BackgroundProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
