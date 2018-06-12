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

var _cryptoJs = require('crypto-js');

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

var _seamlessImmutable = require('seamless-immutable');

var _seamlessImmutable2 = _interopRequireDefault(_seamlessImmutable);

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
        data: _cryptoJs2.default.AES.encrypt((0, _stringify2.default)(inboundState), r).toString(),
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
      return reduxStore[key].redux.INITIAL_STATE;
    } else if (reduxStore[key].encrypt && outboundState.data) {
      var bytes = _cryptoJs2.default.AES.decrypt(outboundState.data, r);
      return (0, _seamlessImmutable2.default)(JSON.parse(bytes.toString(_cryptoJs2.default.enc.Utf8)));
    }
    return (0, _assign2.default)(reduxStore[key].redux.INITIAL_STATE, outboundState);
  }, { whitelist: persistWhitelist });
};