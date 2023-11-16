⚠️ **Disclaimer:** PlanetTechJS is currently in its alpha version and is being developed by a single developer. Consequently, it's important to keep in mind that there may be bugs, spelling errors, lack of tests, and occasional inconsistencies in the library. While every effort is being made to provide a stable and enjoyable experience, please approach the library with the understanding that it's a work in progress. Your feedback, bug reports, and contributions are highly appreciated as they play a crucial role in improving the library and ensuring its quality.


# PlanetTechJS (ALPHA V0.1) 
<p align="center">
  <img src="./public/readmeImg/logoPT.png" />
</p>


**GOAL:**
PlanetTechJS is an open-source JavaScript library built using vanilla THREE.js, accompanied by a React UI for editing planets. Its primary purpose is to generate procedural planets and terrains using a quadtree LOD approach. The aim of this project is not to replicate titles like Star Citizen or No Man's Sky, but rather to provide a toolkit that emulates the tools they might employ for planet creation. The sole focus is on crafting planets, offering a straightforward and adaptable approach to designing realistic and visually captivating 3D planets on a grand scale. The key to the success of this project lies in its ability to handle **scale**, allowing for seamless transitions from the sky to the ground with high resolution. PlanetTechJS will include customizable features such as terrain textures, ground physics, atmospheric effects, and more. Thus, it does not encompass spaceships, weapons, player dynamics, etc.; its sole focus is planet generation.

What sets this library apart is its utilization of the GPU for all tasks. This includes generating textures for each facet, performing displacement, and shaping PlaneGeometries into spherical forms; the entire process occurs on the GPU. Consequently, there is no need for WebWorkers at this stage.

## Getting Started
Download and run the project. Go to http://localhost:3001/. The file for the demo is located at src/lib/viewGL.js. If things aren't working, open an issue, and I will try to correct any problems.


## Features/Ideas
- Procedural planet generation: Create unique and realistic planets using procedural algorithms.
- flexability and speed.
- quadtree sphere.
- CDLOD. (coming soon)
- custom frustum culling. (coming soon)
- raycasting mannequin. (coming soon)
- cubeMap. (threading and instancing coming soon)
- Terrain generation: Generate detailed and customizable terrains with different types of landscapes such as mountains, valleys, and plains.
- Texture mapping: Apply textures to the terrain to enhance visual realism and add visual variety.(coming soon)
- Gpu generated normal map.
- Gpu generated displacement map.
- Atmospheric effects: Simulate atmospheric effects such as clouds, haze, and lighting to create a more immersive environment.(dev complete)
- day and night cycle.(coming soon)
- weather simulation.(coming soon)
- Texture editing / terrain editing. (coming soon)
- Texture Atlas. (dev complete)
- Texture channel packing.(dev complete)
- Texture Splat Map.(dev complete)
- Physics. (coming soon)
- assets.  (coming soon)
- foliage. (coming soon)
- ability to switch from WebGL to WebGPU backended. (dev complete)
- logs.

## Specs
- Recommended GPU is GTX 1060 and above.

# How It Works
The PlanetTechJS repository contains two libraries: **PlanetTech** itself and **CubeMap**. Both PlanetTech and CubeMap are built using ThreeJS experimental NodeMaterial.

Additionally, PlanetTech requires you to use the `render` object. With the `render` object, you can switch between the **WebGL**: `render.WebGLRenderer(canvasViewPort)` and **WebGPU**: `render.WebGPURenderer(canvasViewPort)`. You should stick with WebGL because WebGPU is still very experimental in ThreeJS and can cause issues with each version update.

- **PlanetTech**: Think of it as the backend. It handles planet system management, mesh creation, as well as the generation of quads and quadtree data structures from the `'./PlanetTech/engine'`.

- **CubeMap**: This serves as the frontend and primarily handles texture generation.

- **WorldSpace**: WorldSpace is a post-processing shader that acts as our scene and serves as an abstraction for the space. It handles all the attributes for space in PlanetTechJS, including atmospheric scattering, volumetric lighting, fog, and more. If you need to add a post-processing to the scene use this class.

We will start with **PlanetTech**. Let's create a basic quadtree sphere without any textures or displacement, just coloring each dimension to show what's going on under the hood.
Let's create a basic quadtree sphere without any textures or displacement, just coloring each dimension to show what's going on under the hood.

```javascript
import renderer from './render';
import Sphere   from './PlanetTech/sphere/sphere'
import { getRandomColor,hexToRgbA } from './PlanetTech/engine/utils'

let rend = renderer;
rend.WebGLRenderer(canvasViewPort);
rend.scene();
rend.stats();
rend.camera();
rend.updateCamera(0,0,20000)
rend.orbitControls()

const params = {
  width:          10000,
  height:         10000,
  widthSegment:      50,
  heightSegment:     50,
  quadTreeDimensions: 1,
  levels:             1,
  radius:         10000,
  displacmentScale:   1,
  lodDistanceOffset:1.4,
  material: new NODE.MeshBasicNodeMaterial(),
  color: () => NODE.vec3(...hexToRgbA(getRandomColor())),
}

let s = new Sphere(
  params.width,
  params.height,
  params.widthSegment,
  params.heightSegment,
  params.quadTreeDimensions
)

s.build(
  params.levels,
  params.radius,
  params.displacmentScale,
  params.lodDistanceOffset,
  params.material,
  params.color,
)

rend.scene_.add(s.sphere);

let player = /*player or camera object*/

function update(t) {
  requestAnimationFrame(update);
  s.update(player);
  nodeFrame.update();
  rend.renderer.render(rend.scene_, rend.camera_);
}
