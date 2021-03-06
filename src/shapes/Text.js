const THREE = require('three')
const Shape = require('./Shape')
const json = require('../../assets/helvetiker_regular.typeface.json')

class Text extends Shape {
  constructor(text, world) {
    super({}, world)
    this.text = text || ''
    this.color = this.obj.color || 0x4f4fff
  }
  build() {
    const world = this.world
    var xMid, text

    var loader = new THREE.FontLoader()
    let font = loader.parse(json)

    var matLite = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })

    var shapes = font.generateShapes(this.text, 20)

    var geometry = new THREE.ShapeBufferGeometry(shapes)

    geometry.computeBoundingBox()

    xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)

    geometry.translate(xMid, 0, 0)

    text = new THREE.Mesh(geometry, matLite)
    text.position.z = 2

    world.scene.add(text)
  }
}
module.exports = Text
