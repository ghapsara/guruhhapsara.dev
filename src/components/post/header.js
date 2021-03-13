import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { isMobile } from "../../utils/device"
import Hero from "./hero"
import Title from "../note/item"
import Container from "../container"

const Wrapper = styled(Container)`
  margin-top: 1.5rem;
`

function Header(props) {
  const [isHero, setIsHero] = useState(false);
  useEffect(() => {
    setIsHero(!isMobile(window.innerWidth) & !!props.cover)
  }, [setIsHero]);

  return (
    <>
      {isHero ? (
        <Hero {...props} />
      ) : (
        <Wrapper>
          <Title compact={false} {...props} />
        </Wrapper>
      )}
    </>
  )
}

export default Header
