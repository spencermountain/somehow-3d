const THREE = require('three')
const Shape = require('./Shape')

class Line extends Shape {
  constructor(obj, world) {
    super(obj, world)
  }
  build() {
    var closedSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-60, 20, 60),
      new THREE.Vector3(-60, 120, 60),
      new THREE.Vector3(60, 20, -60)
    ])
    closedSpline.curveType = 'catmullrom'
    closedSpline.closed = false
    var extrudeSettings = {
      steps: 100,
      bevelEnabled: false,
      extrudePath: closedSpline
    }
    var pts = [],
      count = 5
    for (var i = 0; i < count; i++) {
      var l = 5
      var a = ((2 * i) / count) * Math.PI
      pts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l))
    }
    var shape = new THREE.Shape(pts)
    var geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings)
    var material = new THREE.MeshLambertMaterial({ color: 0xdedded, wireframe: false })
    var mesh = new THREE.Mesh(geometry, material)
    this.world.scene.add(mesh)
  }
}
module.exports = Line
