import React from "react"
import styled from "styled-components"

import { device } from "../../utils/device"

import ContainerComp from "../container"
import ContentComp from "../content"
import { Tag as TagComp } from "./item"

export const Container = styled(ContainerComp)`
  max-width: 60rem;
`

export const Intro = styled(ContentComp)`
  margin-bottom: 1.5rem;
`

export const TitleWrapper = styled.div`
  margin: 1.9rem 0;
`

export const Tag = styled(TagComp)`
  display: inline-block;
  font-size: 0.9em;
  margin-bottom: 1.5rem;
  padding: 0.3em 0.9em;
  background: black;
  color: white;
`

export const Title = styled.h1`
  @media ${device.mobileS} {
    font-size: 87px;
  }
  @media ${device.tablet} {
    font-size: 190px;
  }
  margin: 0;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: black;
`

export const Span = styled.span`
  font-family: Titillium Web, sans-serif;
  -webkit-text-fill-color: black;
`

export const Background = styled.div`
  height: 100vh;
  width: 100vw;
  display: grid;
  place-items: center;
`

export const Scroll = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  overflow-x: none;
`

export const Sticky = styled.div`
  position: sticky;
  top: 0;
`

export default {
  Container,
  Intro,
  TitleWrapper,
  Tag,
  Title,
  Span,
  Background,
  Scroll,
  Sticky,
}
