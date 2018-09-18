import { createTransform } from 'redux-persist'
import Aes256 from 'aes256'

export default (reduxStore, persistWhitelist, r) => createTransform(
    (inboundState, key) => {
  if (reduxStore[key].blacklist) {
  const inboundStateTemp = {}
  Object.keys(inboundState).map(param => {
    if (!reduxStore[key].blacklist.includes(param)) {
    inboundStateTemp[param] = inboundState[param]
  }
})
  inboundState = inboundStateTemp
}
else if (reduxStore[key].whitelist) {
  const inboundStateTemp = {}
  reduxStore[key].whitelist.map(param => {
    inboundStateTemp[param] = inboundState[param]
  })
  inboundState = inboundStateTemp
}

if (reduxStore[key].encrypt) {
  delete inboundState['mergeDeep']
  return {
    data: Aes256.encrypt(r, JSON.stringify(inboundState)),
    version: reduxStore[key].version
  }
}
else {
  if (!inboundState.version) {
    inboundState.version = reduxStore[key].version
  }
  return inboundState
}
},
(outboundState, key) => {
  if (reduxStore[key].version && (!outboundState.version || outboundState.version !== reduxStore[key].version)) {
    return reduxStore[key].redux.INITIAL_STATE.asMutable()
  }
  else if (reduxStore[key].encrypt && outboundState.data) {
    const bytes = Aes256.decrypt(r, outboundState.data)
    return JSON.parse(bytes)
  }
  return Object.assign(reduxStore[key].redux.INITIAL_STATE.asMutable(), outboundState)
},
{ whitelist: persistWhitelist }
)
