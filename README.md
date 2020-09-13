# mvt-generator
This module creates MVT tiles directly from PostGIS

## Usage

```
npm i git+https://github.com/watergis/mvt-generator.git
```

```js
const MvtGenerator = require('../src/index');
var extent = [28.861730820621, -2.84023010213741, 30.8997466415943, -1.04716670707785];
var minzoom = 15;
var maxzoom = 15;

const mvtGenerator = new MvtGenerator(config);
await mvtGenerator.generate(extent, minzoom, maxzoom)
```

## Install

```
npm install
```

## Test

```
npm test
```