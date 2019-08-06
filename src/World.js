const THREE = require('three')
const OrbitControls = require('three-orbitcontrols')
const htm = require('htm')
const vhtml = require('vhtml')

const Floor = require('./scene/Floor')
const Light = require('./scene/Light')
const Line = require('./shapes/Line')
const Rect = require('./shapes/Rect')
const Text = require('./shapes/Text')

class World {
  constructor(obj = {}) {
    this.height = obj.height || 400
    this.width = obj.width || this.height * 1.8
    this.html = htm.bind(vhtml)
    this.camera = new THREE.PerspectiveCamera(20, this.width / this.height, 1, 1000)
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({ antialias: true })

    this.shapes = {
      lines: [],
      texts: [],
      rects: []
    }
    this.init()
  }
  bind(fn) {
    this.html = htm.bind(fn)
    return this
  }
  init() {
    this.camera.position.set(100, 170, 600)
    this.scene.background = new THREE.Color(0xffffff)

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)

    this.el = this.renderer.domElement
    var controls = new OrbitControls(this.camera, this.el)
    controls.target.set(0, 0, 0)
    controls.update()

    this.light = new Light({}, this)
    this.light.build()
    this.floor = new Floor({}, this)
    this.floor.build()
  }
  line(obj) {
    let shape = new Line(obj, this)
    shape.build()
    this.shapes.lines.push(shape)
    return shape
  }
  rect(obj) {
    let shape = new Rect(obj, this)
    shape.build()
    this.shapes.rects.push(shape)
    return shape
  }
  text(str) {
    let shape = new Text(str, this)
    shape.build()
    this.shapes.texts.push(shape)
    return shape
  }

  run() {
    console.log('run')
    this.renderer.render(this.scene, this.camera)

    requestAnimationFrame(() => {
      console.log('frame')
      this.renderer.render(this.scene, this.camera)
    })
  }
  build() {
    console.log(this.el)
    return this.el
  }
}

module.exports = World
