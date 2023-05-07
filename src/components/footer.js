import React from "react"
import styled from "styled-components"

import Container from "./container"
import Link from "./link"

const Content = styled(Container)`
  font-size: 15px;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content;
  grid-gap: 10px;
  justify-content: end;
  align-items: center;
  height: 100%;
`

function Footer() {
  return (
    <footer>
      <Content>
        <div>© {new Date().getFullYear()} Guruh Hapsara</div>
        <div>/</div>
        <Link href="mailto:mail@guruhhapsara.dev">contact</Link>
      </Content>
    </footer>
  )
}

export default Footer
