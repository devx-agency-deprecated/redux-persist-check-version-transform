'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _reduxPersist = require('redux-persist');

var _aes = require('aes256');

var _aes2 = _interopRequireDefault(_aes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (reduxStore, persistWhitelist, r) {
  return (0, _reduxPersist.createTransform)(function (inboundState, key) {
    if (reduxStore[key].blacklist) {
      var inboundStateTemp = {};
      (0, _keys2.default)(inboundState).map(function (param) {
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
        data: _aes2.default.encrypt(r, (0, _stringify2.default)(inboundState)),
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
      var bytes = _aes2.default.decrypt(r, outboundState.data);
      return JSON.parse(bytes);
    }
    return (0, _assign2.default)(reduxStore[key].redux.INITIAL_STATE.asMutable(), outboundState);
  }, { whitelist: persistWhitelist });
};