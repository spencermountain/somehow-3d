const THREE = require('three')

class Floor {
  constructor(obj, world) {
    this.obj = obj
    this.world = world
    this.thickness = obj.thickness || 5
    this.depth = obj.depth || 200
    this.x = obj.x || 300
    this.color = obj.color || '#705E5C'
  }
  build() {
    const cubeGeo = new THREE.BoxBufferGeometry(this.x, this.thickness, this.depth)
    const cubeMat = new THREE.MeshPhongMaterial({ color: this.color })
    const mesh = new THREE.Mesh(cubeGeo, cubeMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(0, -5, 0)
    this.world.scene.add(mesh)
  }
}
module.exports = Floor
