import React from "react"
import { Link } from "gatsby"
import styled from "styled-components"

const Container = styled.header`
  position: sticky;
  top: 0;
  margin-bottom: 1.45rem;
  padding: 1.45rem 2rem;
  display: grid;
  grid-template-columns: 1fr 120px 120px;
  background: rgba(245, 245, 247, 0.6);
  z-index: 99999;
  font-size: 16px;
`

const Title = styled.div`
  margin: 0;
  line-height: unset;
`

const Nav = styled(({ primary, ...props }) => <Link {...props} />)`
  text-decoration: none;
  box-shadow: 0 0 0 0 currentColor;
  color: black;
  place-self: ${props => (props.primary ? "auto" : "center")};
`

const Header = () => (
  <Container>
    <Nav to="/" primary>
      <Title>Guruh</Title>
    </Nav>
    <Nav to="/notes">notes</Nav>
    <Nav to="/projects">projects</Nav>
  </Container>
)

export default Header
