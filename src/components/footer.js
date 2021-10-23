import React from "react"
import styled from "styled-components"

import Container from "./container"

const Text = styled.p`
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 0px;
  padding-bottom: 25px;
`

function Footer() {
  return (
    <footer>
      <Container>
        <Text>© {new Date().getFullYear()} Guruh Hapsara</Text>
      </Container>
    </footer>
  )
}

export default Footer
