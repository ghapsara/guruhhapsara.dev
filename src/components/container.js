import styled from "styled-components"
import { device, size } from "../utils/device"

const Container = styled.div`
  margin: 0 auto;
  padding: 0 1.0875rem 1.45rem;

  @media ${device.mobileL} {
    max-width: ${size.mobileS};
  }

  @media ${device.laptop} {
    max-width: 680px;
  }
`

export default Container
