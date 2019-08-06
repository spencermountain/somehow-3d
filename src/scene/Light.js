const THREE = require('three')

class Light {
  constructor(obj, world) {
    this.obj = obj
    this.world = world
  }
  build() {
    let scene = this.world.scene
    const color = 0xffffff
    const intensity = 1
    const light = new THREE.PointLight(color, intensity)
    light.castShadow = true
    light.position.set(160, 120, 150)
    scene.add(light)

    const helper = new THREE.PointLightHelper(light)
    scene.add(helper)
  }
}
module.exports = Light
