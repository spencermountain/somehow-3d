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
    this.width = obj.width || 400
    this.height = obj.height || 300
    this.html = htm.bind(vhtml)
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.el = this.renderer.domElement

    this.shapes = []
    this.init()
  }
  bind(fn) {
    this.html = htm.bind(fn)
    return this
  }
  init() {
    this.camera.position.set(150, 200, 600)
    this.scene.background = new THREE.Color(0xf0f0f0)

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.el)

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
    return shape
  }
  rect(obj) {
    let shape = new Rect(obj, this)
    shape.build()
    return shape
  }
  text(str) {
    let shape = new Text(str, this)
    shape.build()
    return shape
  }

  run() {
    console.log('run')
    // Light(this.scene)
    // Floor(this.scene)
    // Rect(this.scene)
    // Line(this.scene)
    // Text('hello!', this.scene)
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => {
      console.log('frame')
      this.renderer.render(this.scene, this.camera)
    })
  }
  render() {
    // this.renderer.render(this.scene, this.camera)
  }
  build() {
    console.log(this.el)
    return this.el
  }
}

module.exports = World
