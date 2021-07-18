import React from "react"
import styled from "styled-components"

import Container from "./container"

const Text = styled.p`
  font-size: 15px;
  font-weight: bold;
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
