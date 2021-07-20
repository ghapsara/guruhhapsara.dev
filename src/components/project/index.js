import React from "react"
import styled from "styled-components"
import { animated } from "react-spring"

import { device } from "../../utils/device"

export const WIDTH = 1440
export const HEIGHT = 0.75 * 798

export const Wrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
  padding: 0rem 1.2rem;
  @media ${device.mobileS} {
    max-width: ${0.8 * WIDTH}px;
  }
`

export const Container = styled.div`
  display: flex;
  grid-gap: 12px;
  @media ${device.mobileS} {
    flex-direction: column;
  }
  @media ${device.laptop} {
    flex-direction: row;
    flex-wrap: wrap;
  }
`

export const Content = styled.div`
  @media ${device.mobileS} {
    width: ${device.mobileS};
    margin-bottom: 12px;
  }
  @media ${device.laptop} {
    width: ${props => (props.isPortrait ? 0.25 * WIDTH : 0.5 * WIDTH)}px;
  }
  background-color: white;
  border-radius: 28px;
  position: relative;
  color: black;
  text-decoration: none;
  box-shadow: 0 0 0 0;
  display: grid;
  grid-template-rows: ${0.8 * HEIGHT}px ${0.2 * HEIGHT}px;
  position: relative;
  overflow: hidden;
`

export const Media = styled.div`
  height: ${0.8 * HEIGHT}px;
`

export const Img = styled.img`
  object-fit: cover;
  height: 100%;
  width: 100%;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  margin: 0;
`

export const Caption = styled(animated.div)`
  padding: 20px 30px;
  border-radius: 28px;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  background: white;
  min-height: ${HEIGHT * 0.5}px;
`

export const Title = styled.h3`
  margin-bottom: 5px;
`

export const Description = styled.p`
  margin: 0;
  margin-bottom: 25px;
`

export const Links = styled.div`
  display: flex;
`

export const Link = styled.a`
  color: black;
  font-size: 0.9em;
  margin-right: 5px;
`

export const Background = styled.div`
  height: ${HEIGHT * 0.8}px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  border-radius: 28px;
  background-color: ${props => props.color};
`

export const Name = styled.h2`
  position: absolute;
  padding: 30px;
  color: white;
`

export default {
  WIDTH,
  HEIGHT,
  Wrapper,
  Container,
  Content,
  Media,
  Img,
  Caption,
  Title,
  Description,
  Links,
  Link,
  Background,
  Name,
}
