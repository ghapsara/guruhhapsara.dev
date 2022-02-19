import React from "react"
import styled from "styled-components"

import Container from "./container"
import Link from "./link"

const Content = styled(Container)`
  font-size: 15px;
  display: grid;
  grid-template-columns: max-content max-content max-content;
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
        <Link href="https://github.com/ghapsara">Github</Link>
        <Link href="https://twitter.com/guruhhapsara">Twitter</Link>
      </Content>
    </footer>
  )
}

export default Footer
