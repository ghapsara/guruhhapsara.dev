import React from "react";
import styled from "styled-components";
import { isMobile } from "../../utils/device";
import Hero from "./hero";
import Title from "../note/item";
import Container from "../container";

const Wrapper = styled(Container)`
  margin-top: 1.5rem;
`;

function Header(props) {
  const isHero = !isMobile(window.innerWidth) & !!props.cover;
  return (
    <>
      {isHero ?
        (<Hero {...props} />) :
        (
          <Wrapper>
            <Title
              compact={false}
              {...props}
            />
          </Wrapper>
        )
      }
    </>
  )
}

export default Header
