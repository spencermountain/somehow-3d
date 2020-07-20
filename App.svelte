<script>
  import { onMount } from 'svelte'
  import * as GL from '@sveltejs/gl'

  let w = 1
  let h = 1
  let d = 1

  const light = { x: 1, y: 1, z: 1 }
  // far,
  const sun = { x: 0, y: 1, z: 2 }

  const from_hex = hex => parseInt(hex.slice(1), 16)

  const orbitY = function(x) {
    // console.log(x)
    return x
  }

  onMount(() => {
    let frame

    const loop = () => {
      frame = requestAnimationFrame(loop)

      // light.x = 3 * Math.sin(Date.now() * 0.001)
      // light.y = 2.5 + 2 * Math.sin(Date.now() * 0.0004)
      // light.z = 3 * Math.cos(Date.now() * 0.002)
      // console.log(light)
      sun.z += 0.01
      sun.y = orbitY(sun.z)
      // sun.y = 2.5 + 2 * Math.sin(Date.now() * 0.0004)
      // sun.z = 3 * Math.cos(Date.now() * 0.002)
    }

    loop()

    return () => cancelAnimationFrame(frame)
  })
</script>

<style>

</style>

<div class="m4">
  <GL.Scene>
    <!-- <GL.Target id="center" location={[1, 1, 1]} /> -->

    <GL.OrbitControls maxPolarAngle={Math.PI / 2} let:location>
      <!-- location: closeness, pitch,  rotate-->
      <GL.PerspectiveCamera location={[15, 5.5, 5]} lookAt={[5, 1, 5]} near={0.01} far={1000} />
      <!-- <GL.PerspectiveCamera {location} lookAt={[0, 1, 1]} near={0.01} far={1000} /> -->
    </GL.OrbitControls>

    <!-- <GL.AmbientLight intensity={0.3} /> -->
    <GL.DirectionalLight direction={[-1, -1, -1]} intensity={0.5} />

    <!-- floor -->
    <GL.Mesh
      geometry={GL.plane()}
      location={[0, -0.01, 4]}
      rotation={[-90, 0, 0]}
      scale={10}
      uniforms={{ color: from_hex('#8C8C88') }} />

    <!-- cube -->
    <GL.Mesh
      geometry={GL.box()}
      location={[-1, h / 2, 4]}
      rotation={[0, 0, 0]}
      scale={[2, 1.5, 2]}
      uniforms={{ color: from_hex('#2d85a8') }} />
    <!-- spheres -->
    <!-- <GL.Mesh
      geometry={GL.sphere({ turns: 36, bands: 36 })}
      location={[-0.5, 0.4, 1.2]}
      scale={0.4}
      uniforms={{ color: 0x123456, alpha: 0.9 }}
      transparent />

    <GL.Mesh
      geometry={GL.sphere({ turns: 36, bands: 36 })}
      location={[-1.4, 0.6, 0.2]}
      scale={0.6}
      uniforms={{ color: 0x336644, alpha: 0.9 }}
      transparent /> -->

    <GL.Mesh
      geometry={GL.sphere({ turns: 36, bands: 36 })}
      location={[sun.x, sun.y, sun.z]}
      scale={0.6}
      uniforms={{ color: from_hex('#e1e6b3'), alpha: 0.9 }}
      transparent />

    <!-- moving light -->
    <GL.Group location={[light.x, 3, 3]}>
      <GL.Mesh
        geometry={GL.sphere({ turns: 36, bands: 36 })}
        location={[0, 0.2, 0]}
        scale={0}
        uniforms={{ color: 0xffffff, emissive: 0xcccc99 }} />

      <GL.PointLight location={[0, 0, 0]} color={0xffffff} intensity={0.6} />
    </GL.Group>
  </GL.Scene>

</div>
