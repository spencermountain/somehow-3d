const THREE = require('three')
const Shape = require('./Shape')

class Rect extends Shape {
  constructor(obj, world) {
    super(obj, world)
  }
  build() {
    const cubeSize = 50
    const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize)
    const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' })
    const mesh = new THREE.Mesh(cubeGeo, cubeMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(100, cubeSize / 2, 0)
    this.world.scene.add(mesh)
  }
}

// const addRect = function(scene) {
//   var geometry = new THREE.PlaneGeometry(50, 200, 32)
//   var material = new THREE.MeshBasicMaterial({ color: 0xdedfa0, side: THREE.DoubleSide })
//   var plane = new THREE.Mesh(geometry, material)
//   scene.add(plane)
// }
module.exports = Rect
