import { createTransform } from 'redux-persist'
import CryptoJS from 'crypto-js'

export default (reduxStore, persistWhitelist, g) => createTransform(
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
    data: CryptoJS.AES.encrypt(JSON.stringify(inboundState), g).toString(),
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
    const bytes = CryptoJS.AES.decrypt(outboundState.data, g)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  }
  return Object.assign(reduxStore[key].redux.INITIAL_STATE.asMutable(), outboundState)
},
{ whitelist: persistWhitelist }
)
