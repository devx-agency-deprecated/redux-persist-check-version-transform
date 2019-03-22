"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stateReconcilerImmutable = stateReconcilerImmutable;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _reduxPersist = require("redux-persist");

var _seamlessImmutable = _interopRequireDefault(require("seamless-immutable"));

var _aes = _interopRequireDefault(require("aes256"));

var _default = function _default(reduxStore, persistWhitelist, r) {
  return (0, _reduxPersist.createTransform)(function (inboundState, key) {
    if (reduxStore[key].blacklist) {
      var inboundStateTemp = {};
      Object.keys(inboundState).map(function (param) {
        if (!reduxStore[key].blacklist.includes(param)) {
          inboundStateTemp[param] = inboundState[param];
        }
      });
      inboundState = inboundStateTemp;
    } else if (reduxStore[key].whitelist) {
      var _inboundStateTemp = {};
      reduxStore[key].whitelist.map(function (param) {
        _inboundStateTemp[param] = inboundState[param];
      });
      inboundState = _inboundStateTemp;
    }

    if (reduxStore[key].encrypt) {
      delete inboundState['mergeDeep'];
      return {
        data: _aes.default.encrypt(r, JSON.stringify(inboundState)),
        version: reduxStore[key].version
      };
    } else {
      if (!inboundState.version) {
        inboundState.version = reduxStore[key].version;
      }

      return inboundState;
    }
  }, function (outboundState, key) {
    if (reduxStore[key].version && (!outboundState.version || outboundState.version !== reduxStore[key].version)) {
      return reduxStore[key].redux.INITIAL_STATE.asMutable();
    } else if (reduxStore[key].encrypt && outboundState.data) {
      var bytes = _aes.default.decrypt(r, outboundState.data);

      outboundState = JSON.parse(bytes);
    }

    if (reduxStore[key].blacklist) {
      Object.keys(outboundState).forEach(function (param) {
        if (reduxStore[key].blacklist.includes(param)) {
          delete outboundState[param];
        }
      });
    }

    return outboundState;
  }, {
    whitelist: persistWhitelist
  });
};

exports.default = _default;

function stateReconcilerImmutable(inboundState, originalState, reducedState, _ref) {
  var debug = _ref.debug;
  var newState = (0, _seamlessImmutable.default)((0, _objectSpread2.default)({}, reducedState)); // only rehydrate if inboundState exists and is an object

  if (inboundState && (0, _typeof2.default)(inboundState) === 'object') {
    Object.keys(inboundState).forEach(function (key) {
      // ignore _persist data
      if (key === '_persist') return; // if reducer modifies substate, skip auto rehydration

      if (originalState[key] !== reducedState[key]) {
        if (process.env.NODE_ENV !== 'production' && debug) console.log('redux-persist/stateReconciler: sub state for key `%s` modified, skipping.', key);
        return;
      }

      if (reducedState[key] && typeof reducedState[key].asMutable !== 'undefined') {
        // if object is plain enough shallow merge the new values (hence "Level2")
        newState = newState.merge((0, _defineProperty2.default)({}, key, inboundState[key]), {
          deep: true
        });
        return;
      } // otherwise hard set


      newState = newState.set(key, inboundState[key]);
    });
  }

  if (process.env.NODE_ENV !== 'production' && debug && inboundState && (0, _typeof2.default)(inboundState) === 'object') console.log("redux-persist/stateReconciler: rehydrated keys '".concat(Object.keys(inboundState).join(', '), "'"));
  return newState;
}