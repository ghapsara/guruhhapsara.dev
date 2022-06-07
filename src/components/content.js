import styled from "styled-components"

const Content = styled.div`
  /* markdown content */
  color: ${props => props.color};
  div {
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
  margin-bottom: 3em;
`

export default Content
