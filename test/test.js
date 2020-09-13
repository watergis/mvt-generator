const MvtGenerator = require('../src/index');
const config = require('./config');

const test = async()=>{
  var extent = [28.861730820621, -2.84023010213741, 30.8997466415943, -1.04716670707785];
  var minzoom = 15;
  var maxzoom = 15;

  const mvtGenerator = new MvtGenerator(config);
  await mvtGenerator.generate(extent, minzoom, maxzoom)
};

module.exports = test();