import React, { useContext, useReducer } from "react"
import { grey } from "../utils/colors"

const BackgroundStateContext = React.createContext()
const BackgroundDispatchContext = React.createContext()

function reducer(state, action) {
  switch (action.type) {
    case "change": {
      return { color: action.color }
    }
    case "reset": {
      return { color: grey }
    }
    default: {
      return state.color
    }
  }
}

function BackgroundProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { color: grey })
  return (
    <BackgroundStateContext.Provider value={state}>
      <BackgroundDispatchContext.Provider value={dispatch}>
        {children}
      </BackgroundDispatchContext.Provider>
    </BackgroundStateContext.Provider>
  )
}

function useBackgroundState() {
  const context = useContext(BackgroundStateContext)
  if (context === undefined) {
    throw new Error("useBackgroundState must be used within a CountProvider")
  }
  return context
}

function useBackgroundDispatch() {
  const context = useContext(BackgroundDispatchContext)
  if (context === undefined) {
    throw new Error("useBackgroundDispatch must be used within a CountProvider")
  }
  return context
}

export { BackgroundProvider, useBackgroundState, useBackgroundDispatch }
