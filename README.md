# Redux-persist check version transform
Redux persist with version information.

## Install
```git
yarn add https://github.com/devx-agency/redux-persist-check-version-transform
```

## Usage
```javascript
const persistWhitelist = ['userData', 'product']
const reduxStore = {
  userData: {
    redux: require('../Redux/UserDataRedux'),
    blacklist: ['username'],
    encrypt: true,
    version: 1
  },
  product: {
    redux: require('../Redux/ProductRedux'),
    whitelist: ['productName'],
    version: 1
  }
}
const pass = 'pass'
const persistConfig = { // 'redux-persist' config
  key: 'devx',
  storage: localForage,
  transforms: [immutableTransform(), persistCheckVersionTransform(reduxStore, persistWhitelist, pass)],
  whitelist: persistWhitelist
}
```

### Configuration

Variable            |   Type    |   Description                     
---------------     |-----------|-------------------                
persistWhitelist    |   Array<string>    | which redux will be stored
reduxStore          |   {[key: string]: Options}  |  configuration of persist tranform
pass                |   string           | password for encrypted data

### Options
Variable | Type | Description       
---|---|---
redux | | imported redux
blacklist | Array<string> | variables will not be persisted
whitelist | Array<string> | only this variables will be persisted
encrypt | boolean | *default false* if data should be persisted
version | number | data version

When version is incresed, old data will be deleted.

## Thanks to Vašek!