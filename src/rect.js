const THREE = require('three')

const addRect = function(scene) {
  var geometry = new THREE.PlaneGeometry(50, 200, 32)
  var material = new THREE.MeshBasicMaterial({ color: 0xdedfa0, side: THREE.DoubleSide })
  var plane = new THREE.Mesh(geometry, material)
  scene.add(plane)
}
module.exports = addRect
