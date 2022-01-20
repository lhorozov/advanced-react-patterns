// Control Props
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {Switch} from '../switch'
import warning from 'warning'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

const __DEV__ = process.env.NODE_ENV === 'development'
const __PRODUCTION__ = process.env.NODE_ENV === 'production'

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  on: controlledOn,
  readOnly = false,
  onChange,
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const onIsControlled = controlledOn !== null && controlledOn !== undefined

  const on = onIsControlled ? controlledOn : state.on

  const hasOnChange = Boolean(onChange)

  React.useEffect(() => {
    warning(
      !(onIsControlled && !hasOnChange && !readOnly),
      "If you use Toggle with 'on' and without 'onChange', it will leads implicitly to read-only component",
    )
  }, [onIsControlled, hasOnChange, readOnly])

  useControlledSwitchWarning(controlledOn, 'on', 'Toggle')

  function dispatchWithOnChange(action) {
    if (!onIsControlled) {
      dispatch(action)
    }
    onChange?.(reducer({...state, on}, action), action)
  }

  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () =>
    dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function noop() {}

function useControlledSwitchWarning(
  controlPropValue,
  controlPropName,
  componentName,
) {
  const isControlled =
    controlPropValue !== null && controlPropValue !== undefined

  const {current: wasControlled} = React.useRef(isControlled)
  let effect = noop
  if (__DEV__) {
    effect = () => {
      warning(
        !(wasControlled && !isControlled),
        `\`${componentName}\` is changing from controlled to be uncontrolled. Reach UI components should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled \`${componentName}\` for the lifetime of the component. Check the \`${controlPropName}\` prop.`,
      )
      warning(
        !(!wasControlled && isControlled),
        `\`${componentName}\` is changing from uncontrolled to be controlled. Reach UI components should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled \`${componentName}\` for the lifetime of the component. Check the \`${controlPropName}\` prop.`,
      )
    }
  }

  React.useEffect(effect, [
    componentName,
    isControlled,
    controlPropName,
    wasControlled,
    effect,
  ])
}

function Toggle({on: controlledOn, onChange, readOnly = false}) {
  const {on, getTogglerProps} = useToggle({
    on: controlledOn,
    onChange,
    readOnly,
  })
  const props = getTogglerProps({on})
  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn()
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}
