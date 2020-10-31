import React from "react"
import styled from "styled-components"

import Container from "./container"

const Text = styled.h6`
  margin: 0;
`

function Footer() {
  return (
    <footer>
      <Container style={{ marginBottom: 10 }}>
        <Text>© {new Date().getFullYear()} Guruh Hapsara</Text>
      </Container>
    </footer>
  )
}

export default Footer
