import React from "react"
import styled from "styled-components"

const Content = styled.div`
  /* markdown content */
  color: ${props => props.color};
  div {
    display: grid;
    grid-template-columns: 1fr;
    a {
      word-break: break-all;
    }
    p {
      /* margin-bottom: 1rem; */
    }
    blockquote {
      border-left: 2px solid black;
      margin-left: 1rem;
      padding-left: 0.5rem;
      font-style: italic;
      font-weight: 500;
    }
  }
`

export default Content
