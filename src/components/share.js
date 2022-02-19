import React, { useEffect } from "react"
import styled from "styled-components"
import { grey } from "../utils/colors"

const Container = styled.div`
  margin: 40px 0;
  display: flex;
  align-items: center;
`

const Line = styled.hr`
  flex-grow: 1;
  margin: 0;
  /* border-bottom: 1px solid ${grey}; */
`

const Tweet = styled.div`
  margin: 0px 10px;
  padding: 0;
  > iframe {
    margin: 0;
  }
`

function Share({ postUrl }) {
  useEffect(() => {
    window.twttr = (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {}
      if (d.getElementById(id)) return t
      js = d.createElement(s)
      js.id = id
      js.src = "https://platform.twitter.com/widgets.js"
      fjs.parentNode.insertBefore(js, fjs)

      t._e = []
      t.ready = function (f) {
        t._e.push(f)
      }

      return t
    })(document, "script", "twitter-wjs")
  })

  const tweetUrl = `https://twitter.com/intent/tweet?url=${postUrl}`

  return (
    <Container>
      <Tweet>
        <a className="twitter-share-button" data-size="large" href={tweetUrl}>
          Tweet
        </a>
      </Tweet>
      <Line />
    </Container>
  )
}

export default Share
