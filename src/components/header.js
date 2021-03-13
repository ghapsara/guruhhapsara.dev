import React, { useState, useEffect } from "react"
import { Link as GatsbyLink } from "gatsby"
import styled from "styled-components"

const Container = styled.header`
  position: sticky;
  top: 0;
  padding: 0rem 2rem;
  display: grid;
  grid-template-columns: 1fr 90px 90px;
  background: rgba(245, 245, 247, 0.6);
  z-index: 99999;
  font-size: 16px;
  height: ${props => props.height ? props.height: 70}px;
`

const Link = styled(GatsbyLink)`
  color: black;
  box-shadow: 0 0 0 0 currentColor;
  text-decoration: none;
  :hover {
    color: #c06c84;
  }
`

const Title = styled(Link)`
  align-self: center;
  font-family: "Luckiest Guy";
  font-size: 18px;
  margin-top: 7px;
`

const Nav = styled(Link)`
  place-self: center;
  font-size: 15px;
`

function Header() {
  const [height, setHeight] = useState(70);
  useEffect(() => {
    setHeight(window.innerHeight * 0.09)
  }, [setHeight]);

  return (
    <Container height={height}>
      <Title to="/">Guruh</Title>
      <Nav to="/notes">notes</Nav>
      <Nav to="/projects">projects</Nav>
    </Container>
  )
}

export default Header
