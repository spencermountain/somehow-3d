const World = require('./World')

// ...people call this a factory
const somehow3D = function(obj) {
  return new World(obj)
}
module.exports = somehow3D
