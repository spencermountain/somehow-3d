const THREE = require('three')

function addText(str, scene) {
  var loader = new THREE.FontLoader()
  loader.load('../assets/helvetiker_regular.typeface.json', function(font) {
    var xMid, text

    var matLite = new THREE.MeshBasicMaterial({
      color: 0x006699,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })

    var shapes = font.generateShapes(str, 20)

    var geometry = new THREE.ShapeBufferGeometry(shapes)

    geometry.computeBoundingBox()

    xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)

    geometry.translate(xMid, 0, 0)

    text = new THREE.Mesh(geometry, matLite)
    text.position.z = 2
    scene.add(text)
  })
}
module.exports = addText
