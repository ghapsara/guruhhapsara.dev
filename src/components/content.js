import React from "react"
import styled from "styled-components"

import { device, size } from "../utils/device"

const Content = styled.div`
  @media ${device.mobileS} {
    max-width: ${size.mobileS};
  }

  @media ${device.mobileMm} {
    max-width: 380px;
  }

  @media ${device.mobileL} {
    max-width: ${size.mobileL};
  }

  @media ${device.laptop} {
    max-width: ${size.laptop};
  }

  @media ${device.desktop} {
    max-width: 680px;
  }
`

export default Content
