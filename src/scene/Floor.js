const THREE = require('three')

class Floor {
  constructor(obj, world) {
    this.obj = obj
    this.world = world
  }
  build() {
    const cubeSize = 400
    const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, 5, cubeSize)
    const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' })
    const mesh = new THREE.Mesh(cubeGeo, cubeMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(0, -5, 0)
    this.world.scene.add(mesh)
  }
}
module.exports = Floor
