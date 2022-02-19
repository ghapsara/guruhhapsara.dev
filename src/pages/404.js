import React from "react"
import styled from "styled-components"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Container from "../components/container"
import Background from "../components/background"

const Content = styled(Container)`
  display: grid;
  grid-template-rows: 1fr;
  align-items: center;
  justify-content: center;
  height: 100%;
`

const Span = styled.span`
  font-weight: bold;
`

const NotFoundPage = () => {
  return (
    <Layout>
      <Background color="transparent" />
      <SEO title="404: Not found" />
      <Content>
        <div>
          <h1>NO, IT'S NOT DNS</h1>
          <p>
            <Span>[404]</Span> Not found.
          </p>
        </div>
      </Content>
    </Layout>
  )
}

export default NotFoundPage
