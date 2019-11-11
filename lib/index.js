// @flow
import { createTransform } from 'redux-persist'
import Immutable from 'seamless-immutable'
import CryptoJS from 'crypto-js'

export default (reduxStore: any, persistWhitelist: string[], r: string) =>
  createTransform(
    (inboundState, key) => {
      if (reduxStore[key].blacklist) {
        const inboundStateTemp = {}
        Object.keys(inboundState).forEach((param) => {
          if (!reduxStore[key].blacklist.includes(param)) {
            inboundStateTemp[param] = inboundState[param]
          }
        })
        inboundState = inboundStateTemp
      } else if (reduxStore[key].whitelist) {
        const inboundStateTemp = {}
        reduxStore[key].whitelist.forEach((param) => {
          inboundStateTemp[param] = inboundState[param]
        })
        inboundState = inboundStateTemp
      }

      if (reduxStore[key].encrypt) {
        delete inboundState.mergeDeep
        return {
          data: CryptoJS.AES.encrypt(JSON.stringify(inboundState), r),
          version: reduxStore[key].version,
        }
      }
      if (!inboundState.version) {
        inboundState.version = reduxStore[key].version
      }
      return inboundState
    },
    (outboundState, key) => {
      if (reduxStore[key].version && (!outboundState.version || outboundState.version !== reduxStore[key].version)) {
        return reduxStore[key].redux.INITIAL_STATE.asMutable()
      }
      if (reduxStore[key].encrypt && outboundState.data) {
        const bytes = CryptoJS.AES.decrypt(outboundState.data, r)
        outboundState = JSON.parse(bytes)
      }
      if (reduxStore[key].blacklist) {
        Object.keys(outboundState).forEach((param) => {
          if (reduxStore[key].blacklist.includes(param)) {
            delete outboundState[param]
          }
        })
      }
      return outboundState
    },
    { whitelist: persistWhitelist },
  )

export function stateReconcilerImmutable<State: Object>(
  inboundState: State,
  originalState: State,
  reducedState: State,
  { debug }: { debug: boolean },
): State {
  let newState = Immutable({ ...reducedState })
  // only rehydrate if inboundState exists and is an object
  if (inboundState && typeof inboundState === 'object') {
    Object.keys(inboundState).forEach((key) => {
      // ignore _persist data
      if (key === '_persist') return
      // if reducer modifies substate, skip auto rehydration
      if (originalState[key] !== reducedState[key]) {
        if (process.env.NODE_ENV !== 'production' && debug)
          console.log('redux-persist/stateReconciler: sub state for key `%s` modified, skipping.', key)
        return
      }
      if (reducedState[key] && typeof reducedState[key].asMutable !== 'undefined') {
        // if object is plain enough shallow merge the new values (hence "Level2")
        newState = newState.merge({ [key]: inboundState[key] }, { deep: true })
        return
      }
      // otherwise hard set
      newState = newState.set(key, inboundState[key])
    })
  }

  if (process.env.NODE_ENV !== 'production' && debug && inboundState && typeof inboundState === 'object')
    console.log(`redux-persist/stateReconciler: rehydrated keys '${Object.keys(inboundState).join(', ')}'`)

  return newState
}
