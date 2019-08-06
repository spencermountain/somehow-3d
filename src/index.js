const THREE = require('three')
const OrbitControls = require('three-orbitcontrols')
const addText = require('./text')

const addPlane = function(scene) {
  const planeSize = 400
  const loader = new THREE.TextureLoader()
  const texture = loader.load(
    'https://threejsfundamentals.org/threejs/resources/images/checker.png'
  )
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.NearestFilter
  const repeats = planeSize / 2
  texture.repeat.set(repeats, repeats)

  const planeGeo = new THREE.PlaneBufferGeometry(planeSize, 200)
  const planeMat = new THREE.MeshPhongMaterial({
    map: texture,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(planeGeo, planeMat)
  mesh.receiveShadow = true
  mesh.rotation.x = Math.PI * -0.5
  scene.add(mesh)
}

const addShape = function(scene) {
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
  scene.add(mesh)
}

const addLight = function(scene) {
  const color = 0xffffff
  const intensity = 1
  const light = new THREE.PointLight(color, intensity)
  light.castShadow = true
  light.position.set(160, 120, 150)
  scene.add(light)

  const helper = new THREE.PointLightHelper(light)
  scene.add(helper)
}

const addCube = function(scene) {
  const cubeSize = 50
  const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize)
  const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' })
  const mesh = new THREE.Mesh(cubeGeo, cubeMat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(100, cubeSize / 2, 0)
  scene.add(mesh)
}

const addGround = function(scene) {
  const cubeSize = 400
  const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, 5, cubeSize)
  const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' })
  const mesh = new THREE.Mesh(cubeGeo, cubeMat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(0, -5, 0)
  scene.add(mesh)
}

var camera, scene, renderer
function init() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.set(150, 200, 600)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  addText('hello!', scene)

  addLight(scene)
  addCube(scene)
  addGround(scene)
  addShape(scene)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  var controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.update()

  // window.addEventListener('resize', onWindowResize, false)
} // end init

function animate() {
  requestAnimationFrame(animate)

  render()
}

function render() {
  renderer.render(scene, camera)
}

init()
animate()
